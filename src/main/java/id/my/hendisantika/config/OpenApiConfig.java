package id.my.hendisantika.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
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
 * Time: 15.31
 */
@Configuration
public class OpenApiConfig {

    public static final String HOST_TOKEN_SCHEME = "hostToken";

    @Bean
    public OpenAPI liveStreamingOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Live Streaming API")
                        .version("v1")
                        .description("""
                                Token server untuk kelas live berbasis LiveKit.

                                **Peran:** `HOST` (publish + atur peserta), `CO_HOST` (publish), `VIEWER` (menonton, chat, angkat tangan).

                                1. Minta token lewat `POST /api/rooms/{room}/token`. Peran HOST / CO_HOST wajib header `X-Host-Key`.
                                2. Hubungkan client LiveKit ke `serverUrl` memakai `token` dari respons.
                                3. Host dapat menaikkan / menurunkan peserta untuk tanya jawab dengan token LiveKit miliknya
                                   (tombol **Authorize** → `hostToken`).

                                Error dikembalikan dalam format Problem Details (RFC 9457).""")
                        .contact(new Contact().name("Hendi Santika").url("https://s.id/hendisantika"))
                        .license(new License().name("Live demo: live.jvm.my.id").url("https://live.jvm.my.id")))
                .components(new Components()
                        .addSecuritySchemes(HOST_TOKEN_SCHEME, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token LiveKit milik HOST room tersebut (field `token` dari endpoint token).")));
    }
}
