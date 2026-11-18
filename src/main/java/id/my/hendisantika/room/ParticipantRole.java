package id.my.hendisantika.room;

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
public enum ParticipantRole {
    HOST,
    CO_HOST,
    VIEWER;

    public boolean canPublish() {
        return this != VIEWER;
    }

    public boolean isRoomAdmin() {
        return this == HOST;
    }

    public boolean requiresHostKey() {
        return this != VIEWER;
    }
}
