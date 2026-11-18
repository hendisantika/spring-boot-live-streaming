package id.my.hendisantika.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Created by IntelliJ IDEA.
 * Project : spring-boot-live-streaming
 * User: hendisantika
 * Email: hendisantika@gmail.com
 * Telegram : @hendisantika34
 * Link : s.id/hendisantika
 * Date: 18/11/26
 * Time: 15.32
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OpenApiDocsTest {

    @LocalServerPort
    int port;

    private final HttpClient client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();

    private HttpResponse<String> get(String path, String... headers) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (headers.length > 0) {
            builder.headers(headers);
        }
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void openApiSpecDocumentsAllEndpoints() throws Exception {
        HttpResponse<String> response = get("/api/openapi");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("Live Streaming API")
                .contains("/api/rooms/{room}/token")
                .contains("/api/rooms/{room}/participants/{identity}/promote")
                .contains("/api/rooms/{room}/participants/{identity}/demote")
                .contains("X-Host-Key")
                .contains("\"hostToken\"");
    }

    @Test
    void serverUrlFollowsForwardedHeaders() throws Exception {
        HttpResponse<String> response = get("/api/openapi",
                "X-Forwarded-Proto", "https", "X-Forwarded-Host", "streaming.jvm.my.id");

        assertThat(response.body()).contains("\"url\":\"https://streaming.jvm.my.id\"");
    }

    @Test
    void swaggerUiIsServedUnderApiPrefix() throws Exception {
        HttpResponse<String> response = get("/api/docs");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.uri().getPath()).startsWith("/api/");
        assertThat(response.body()).contains("swagger-ui");
    }
}
