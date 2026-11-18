package id.my.hendisantika.room;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import id.my.hendisantika.config.LiveKitProperties;
import id.my.hendisantika.room.dto.TokenRequest;
import id.my.hendisantika.room.dto.TokenResponse;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Created by IntelliJ IDEA.
 * Project : spring-boot-live-streaming
 * User: hendisantika
 * Email: hendisantika@gmail.com
 * Telegram : @hendisantika34
 * Link : s.id/hendisantika
 * Date: 18/11/26
 * Time: 14.16
 */
class LiveKitTokenServiceTest {

    static final LiveKitProperties PROPS = new LiveKitProperties("ws://lk.test", "http://lk.test",
            "testkey", "testsecret-testsecret-testsecret-1234", "host-key", Duration.ofHours(1), List.of("http://localhost:3000"));

    private final LiveKitTokenService service = new LiveKitTokenService(PROPS);

    private DecodedJWT verify(TokenResponse response) {
        return JWT.require(Algorithm.HMAC256(PROPS.apiSecret())).withIssuer(PROPS.apiKey()).build().verify(response.token());
    }

    @Test
    void hostTokenCanPublishAndIsRoomAdmin() {
        TokenResponse response = service.createToken("kelas-1", new TokenRequest("guru-1", "Pak Guru", ParticipantRole.HOST));

        DecodedJWT jwt = verify(response);
        Map<String, Object> video = jwt.getClaim("video").asMap();
        assertThat(jwt.getSubject()).isEqualTo("guru-1");
        assertThat(jwt.getClaim("name").asString()).isEqualTo("Pak Guru");
        assertThat(video).containsEntry("room", "kelas-1").containsEntry("roomJoin", true)
                .containsEntry("canPublish", true).containsEntry("roomAdmin", true);
        assertThat(jwt.getClaim("attributes").asMap()).containsEntry("role", "HOST");
        assertThat(response.serverUrl()).isEqualTo("ws://lk.test");
    }

    @Test
    void coHostTokenCanPublishButIsNotRoomAdmin() {
        Map<String, Object> video = verify(service.createToken("kelas-1",
                new TokenRequest("asisten-1", null, ParticipantRole.CO_HOST))).getClaim("video").asMap();

        assertThat(video).containsEntry("canPublish", true);
        assertThat(video.get("roomAdmin")).isNotEqualTo(true);
    }

    @Test
    void viewerTokenCannotPublishMediaButCanSendData() {
        TokenResponse response = service.createToken("kelas-1", new TokenRequest("siswa-1", null, null));

        DecodedJWT jwt = verify(response);
        Map<String, Object> video = jwt.getClaim("video").asMap();
        assertThat(response.role()).isEqualTo(ParticipantRole.VIEWER);
        assertThat(jwt.getClaim("name").asString()).isEqualTo("siswa-1");
        assertThat(video).containsEntry("canPublish", false).containsEntry("canSubscribe", true)
                .containsEntry("canPublishData", true);
        assertThat(video.get("roomAdmin")).isNotEqualTo(true);
    }
}
