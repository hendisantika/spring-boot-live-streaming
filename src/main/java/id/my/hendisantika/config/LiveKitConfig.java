package id.my.hendisantika.config;

import io.livekit.server.LiveKitAPI;
import io.livekit.server.RoomServiceClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
@Configuration
public class LiveKitConfig {

    @Bean
    public RoomServiceClient roomServiceClient(LiveKitProperties properties) {
        return LiveKitAPI.createClient(properties.apiUrl(), properties.apiKey(), properties.apiSecret()).getRoom();
    }
}
