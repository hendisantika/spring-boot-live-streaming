package id.my.hendisantika.room;

import id.my.hendisantika.config.LiveKitProperties;
import id.my.hendisantika.room.dto.TokenRequest;
import id.my.hendisantika.room.dto.TokenResponse;
import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanPublishData;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomAdmin;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import org.springframework.stereotype.Service;

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
@Service
public class LiveKitTokenService {

    public static final String ROLE_ATTRIBUTE = "role";

    private final LiveKitProperties properties;

    public LiveKitTokenService(LiveKitProperties properties) {
        this.properties = properties;
    }

    public TokenResponse createToken(String room, TokenRequest request) {
        ParticipantRole role = request.roleOrDefault();

        AccessToken token = new AccessToken(properties.apiKey(), properties.apiSecret());
        token.setIdentity(request.identity());
        token.setName(request.name() == null || request.name().isBlank() ? request.identity() : request.name());
        token.setTtl(properties.tokenTtl().toMillis());
        token.getAttributes().put(ROLE_ATTRIBUTE, role.name());
        token.addGrants(
                new RoomJoin(true),
                new RoomName(room),
                new CanSubscribe(true),
                new CanPublish(role.canPublish()),
                // Semua peran boleh kirim data: chat & angkat tangan untuk tanya jawab
                new CanPublishData(true),
                new RoomAdmin(role.isRoomAdmin())
        );

        return new TokenResponse(properties.url(), token.toJwt(), room, request.identity(), role);
    }
}
