package id.my.hendisantika.room.dto;

import id.my.hendisantika.room.ParticipantRole;

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
public record TokenResponse(
        String serverUrl,
        String token,
        String room,
        String identity,
        ParticipantRole role
) {
}
