package id.my.hendisantika.room.dto;

import id.my.hendisantika.room.ParticipantRole;
import io.swagger.v3.oas.annotations.media.Schema;

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
@Schema(description = "Token LiveKit beserta alamat server")
public record TokenResponse(
        @Schema(description = "URL WebSocket LiveKit untuk client", example = "wss://streaming.jvm.my.id")
        String serverUrl,
        @Schema(description = "Access token LiveKit (JWT)")
        String token,
        @Schema(example = "kelas-1")
        String room,
        @Schema(example = "siswa-1")
        String identity,
        ParticipantRole role
) {
}
