package id.my.hendisantika.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;
import java.util.List;

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
@ConfigurationProperties(prefix = "livekit")
public record LiveKitProperties(
        /* URL WebSocket LiveKit yang dipakai client (web/mobile), mis. ws://localhost:7880 */
        String url,
        /* URL HTTP LiveKit untuk server API, mis. http://localhost:7880 */
        String apiUrl,
        String apiKey,
        String apiSecret,
        /* Kunci sementara untuk minta token HOST / CO_HOST, sampai ada auth/login */
        String hostAccessKey,
        @DefaultValue("6h") Duration tokenTtl,
        @DefaultValue("http://localhost:3000") List<String> allowedOrigins
) {
}
