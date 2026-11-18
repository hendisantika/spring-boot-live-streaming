package id.my.hendisantika.room.dto;

import id.my.hendisantika.room.ParticipantRole;
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
public record TokenRequest(
        @NotBlank @Size(max = 64) @Pattern(regexp = "[A-Za-z0-9_.@-]+") String identity,
        @Size(max = 100) String name,
        ParticipantRole role
) {
    public ParticipantRole roleOrDefault() {
        return role == null ? ParticipantRole.VIEWER : role;
    }
}
