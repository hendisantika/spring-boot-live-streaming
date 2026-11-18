package id.my.hendisantika.room;

import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels.ParticipantInfo;
import livekit.LivekitModels.ParticipantPermission;
import livekit.LivekitModels.TrackSource;
import okhttp3.ResponseBody;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Created by IntelliJ IDEA.
 * Project : spring-boot-live-streaming
 * User: hendisantika
 * Email: hendisantika@gmail.com
 * Telegram : @hendisantika34
 * Link : s.id/hendisantika
 * Date: 18/11/26
 * Time: 14.18
 */
class ParticipantServiceTest {

    private final RoomServiceClient client = mock(RoomServiceClient.class);
    @SuppressWarnings("unchecked")
    private final Call<ParticipantInfo> call = mock(Call.class);
    private final ParticipantService service = new ParticipantService(client);

    private ArgumentCaptor<ParticipantPermission> permissionCaptor = ArgumentCaptor.forClass(ParticipantPermission.class);
    @SuppressWarnings("unchecked")
    private ArgumentCaptor<Map<String, String>> attributesCaptor = ArgumentCaptor.forClass(Map.class);

    private void stubResponse(Response<ParticipantInfo> response) throws IOException {
        when(client.updateParticipant(eq("kelas-1"), eq("siswa-1"), isNull(), isNull(),
                permissionCaptor.capture(), attributesCaptor.capture())).thenReturn(call);
        when(call.execute()).thenReturn(response);
    }

    @Test
    void promoteAllowsMicAndCamera() throws IOException {
        stubResponse(Response.success(ParticipantInfo.getDefaultInstance()));

        service.promote("kelas-1", "siswa-1");

        ParticipantPermission permission = permissionCaptor.getValue();
        assertThat(permission.getCanPublish()).isTrue();
        assertThat(permission.getCanSubscribe()).isTrue();
        assertThat(permission.getCanPublishData()).isTrue();
        assertThat(permission.getCanPublishSourcesList()).containsExactly(TrackSource.MICROPHONE, TrackSource.CAMERA);
        assertThat(attributesCaptor.getValue()).containsEntry("role", "SPEAKER");
    }

    @Test
    void demoteRevokesPublish() throws IOException {
        stubResponse(Response.success(ParticipantInfo.getDefaultInstance()));

        service.demote("kelas-1", "siswa-1");

        assertThat(permissionCaptor.getValue().getCanPublish()).isFalse();
        assertThat(permissionCaptor.getValue().getCanSubscribe()).isTrue();
        assertThat(attributesCaptor.getValue()).containsEntry("role", "VIEWER");
    }

    @Test
    void unknownParticipantIsNotFound() throws IOException {
        stubResponse(Response.error(404, ResponseBody.create("{}", null)));

        assertThatThrownBy(() -> service.promote("kelas-1", "siswa-1"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void liveKitDownIsBadGateway() throws IOException {
        when(client.updateParticipant(any(), any(), any(), any(), any(), anyMap())).thenReturn(call);
        when(call.execute()).thenThrow(new IOException("connection refused"));

        assertThatThrownBy(() -> service.demote("kelas-1", "siswa-1"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
    }
}
