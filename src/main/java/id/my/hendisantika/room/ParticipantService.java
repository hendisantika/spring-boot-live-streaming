package id.my.hendisantika.room;

import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels.ParticipantPermission;
import livekit.LivekitModels.TrackSource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import retrofit2.Response;

import java.io.IOException;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * Project : spring-boot-live-streaming
 * User: hendisantika
 * Email: hendisantika@gmail.com
 * Telegram : @hendisantika34
 * Link : s.id/hendisantika
 * Date: 18/11/26
 * Time: 14.17
 */
@Service
public class ParticipantService {

    public static final String SPEAKER_ROLE = "SPEAKER";

    private final RoomServiceClient roomServiceClient;

    public ParticipantService(RoomServiceClient roomServiceClient) {
        this.roomServiceClient = roomServiceClient;
    }

    /** Viewer boleh menyalakan mic & kamera untuk bertanya (bukan share screen). */
    public void promote(String room, String identity) {
        ParticipantPermission permission = basePermission()
                .setCanPublish(true)
                .addCanPublishSources(TrackSource.MICROPHONE)
                .addCanPublishSources(TrackSource.CAMERA)
                .build();
        update(room, identity, permission, SPEAKER_ROLE);
    }

    /** Kembali jadi viewer; LiveKit otomatis meng-unpublish track miliknya. */
    public void demote(String room, String identity) {
        ParticipantPermission permission = basePermission().setCanPublish(false).build();
        update(room, identity, permission, ParticipantRole.VIEWER.name());
    }

    private static ParticipantPermission.Builder basePermission() {
        return ParticipantPermission.newBuilder()
                .setCanSubscribe(true)
                .setCanPublishData(true);
    }

    private void update(String room, String identity, ParticipantPermission permission, String role) {
        try {
            Response<?> response = roomServiceClient
                    .updateParticipant(room, identity, null, null, permission,
                            Map.of(LiveKitTokenService.ROLE_ATTRIBUTE, role))
                    .execute();
            if (response.code() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Peserta tidak ada di room");
            }
            if (!response.isSuccessful()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "LiveKit menolak permintaan: HTTP " + response.code());
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Tidak bisa menghubungi LiveKit", e);
        }
    }
}
