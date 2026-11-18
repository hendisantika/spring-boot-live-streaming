package id.my.hendisantika.room.dto;

import id.my.hendisantika.room.ParticipantRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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
@Schema(description = "Permintaan token LiveKit")
public record TokenRequest(
        @Schema(description = "ID unik peserta di room", example = "siswa-1")
        @NotBlank @Size(max = 64) @Pattern(regexp = "[A-Za-z0-9_.@-]+") String identity,
        @Schema(description = "Nama tampilan; default = identity", example = "Budi")
        @Size(max = 100) String name,
        @Schema(description = "Peran di room; default VIEWER", defaultValue = "VIEWER")
        ParticipantRole role
) {
    public ParticipantRole roleOrDefault() {
        return role == null ? ParticipantRole.VIEWER : role;
    }
}
