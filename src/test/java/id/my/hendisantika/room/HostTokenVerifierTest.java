package id.my.hendisantika.room;

import id.my.hendisantika.room.dto.TokenRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static id.my.hendisantika.room.LiveKitTokenServiceTest.PROPS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
class HostTokenVerifierTest {

    private final LiveKitTokenService tokenService = new LiveKitTokenService(PROPS);
    private final HostTokenVerifier verifier = new HostTokenVerifier(PROPS);

    private String bearer(String room, ParticipantRole role) {
        return "Bearer " + tokenService.createToken(room, new TokenRequest("user-1", null, role)).token();
    }

    private void assertStatus(String header, String room, HttpStatus status) {
        assertThatThrownBy(() -> verifier.verifyHost(header, room))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(status));
    }

    @Test
    void hostOfSameRoomIsAccepted() {
        assertThat(verifier.verifyHost(bearer("kelas-1", ParticipantRole.HOST), "kelas-1")).isEqualTo("user-1");
    }

    @Test
    void hostOfOtherRoomIsForbidden() {
        assertStatus(bearer("kelas-2", ParticipantRole.HOST), "kelas-1", HttpStatus.FORBIDDEN);
    }

    @Test
    void coHostAndViewerAreForbidden() {
        assertStatus(bearer("kelas-1", ParticipantRole.CO_HOST), "kelas-1", HttpStatus.FORBIDDEN);
        assertStatus(bearer("kelas-1", ParticipantRole.VIEWER), "kelas-1", HttpStatus.FORBIDDEN);
    }

    @Test
    void missingOrForgedTokenIsUnauthorized() {
        assertStatus(null, "kelas-1", HttpStatus.UNAUTHORIZED);
        assertStatus("Basic abc", "kelas-1", HttpStatus.UNAUTHORIZED);

        LiveKitTokenService otherServer = new LiveKitTokenService(new id.my.hendisantika.config.LiveKitProperties(
                PROPS.url(), PROPS.apiUrl(), PROPS.apiKey(), "secret-lain-secret-lain-secret-lain-99",
                null, PROPS.tokenTtl(), PROPS.allowedOrigins()));
        String forged = "Bearer " + otherServer.createToken("kelas-1",
                new TokenRequest("penyusup", null, ParticipantRole.HOST)).token();
        assertStatus(forged, "kelas-1", HttpStatus.UNAUTHORIZED);
    }
}
