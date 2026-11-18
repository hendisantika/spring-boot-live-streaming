package id.my.hendisantika.room;

import id.my.hendisantika.config.LiveKitProperties;
import id.my.hendisantika.room.dto.TokenRequest;
import id.my.hendisantika.room.dto.TokenResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

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
@Validated
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    public static final String ROOM_PATTERN = "[A-Za-z0-9_-]{1,64}";
    public static final String IDENTITY_PATTERN = "[A-Za-z0-9_.@-]{1,64}";

    private final LiveKitTokenService tokenService;
    private final LiveKitProperties properties;
    private final HostTokenVerifier hostTokenVerifier;
    private final ParticipantService participantService;

    public RoomController(LiveKitTokenService tokenService, LiveKitProperties properties,
                          HostTokenVerifier hostTokenVerifier, ParticipantService participantService) {
        this.tokenService = tokenService;
        this.properties = properties;
        this.hostTokenVerifier = hostTokenVerifier;
        this.participantService = participantService;
    }

    @PostMapping("/{room}/token")
    public TokenResponse createToken(@PathVariable @Pattern(regexp = ROOM_PATTERN) String room,
                                     @RequestHeader(name = "X-Host-Key", required = false) String hostKey,
                                     @Valid @RequestBody TokenRequest request) {
        if (request.roleOrDefault().requiresHostKey() && !isValidHostKey(hostKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Host key tidak valid untuk role " + request.roleOrDefault());
        }
        return tokenService.createToken(room, request);
    }

    @PostMapping("/{room}/participants/{identity}/promote")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void promote(@PathVariable @Pattern(regexp = ROOM_PATTERN) String room,
                        @PathVariable @Pattern(regexp = IDENTITY_PATTERN) String identity,
                        @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        hostTokenVerifier.verifyHost(authorization, room);
        participantService.promote(room, identity);
    }

    @PostMapping("/{room}/participants/{identity}/demote")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void demote(@PathVariable @Pattern(regexp = ROOM_PATTERN) String room,
                       @PathVariable @Pattern(regexp = IDENTITY_PATTERN) String identity,
                       @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        hostTokenVerifier.verifyHost(authorization, room);
        participantService.demote(room, identity);
    }

    private boolean isValidHostKey(String hostKey) {
        String expected = properties.hostAccessKey();
        if (expected == null || expected.isBlank() || hostKey == null) {
            return false;
        }
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), hostKey.getBytes(StandardCharsets.UTF_8));
    }
}
