package id.my.hendisantika.room;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import id.my.hendisantika.config.LiveKitProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

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
/**
 * Memastikan pemanggil adalah HOST di room tersebut, dengan memverifikasi token LiveKit
 * yang sebelumnya diterbitkan oleh {@link LiveKitTokenService}.
 */
@Component
public class HostTokenVerifier {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JWTVerifier verifier;

    public HostTokenVerifier(LiveKitProperties properties) {
        this.verifier = JWT.require(Algorithm.HMAC256(properties.apiSecret()))
                .withIssuer(properties.apiKey())
                .build();
    }

    /**
     * @return identity host yang terverifikasi
     */
    public String verifyHost(String authorizationHeader, String room) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token host tidak ada");
        }

        DecodedJWT jwt;
        try {
            jwt = verifier.verify(authorizationHeader.substring(BEARER_PREFIX.length()).trim());
        } catch (JWTVerificationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token host tidak valid");
        }

        Map<String, Object> video = jwt.getClaim("video").asMap();
        boolean roomAdmin = video != null && Boolean.TRUE.equals(video.get("roomAdmin"));
        boolean sameRoom = video != null && room.equals(video.get("room"));
        if (!roomAdmin || !sameRoom) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hanya host room ini yang boleh mengatur peserta");
        }
        return jwt.getSubject();
    }
}
