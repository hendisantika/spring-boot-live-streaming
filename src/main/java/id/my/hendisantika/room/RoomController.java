package id.my.hendisantika.room;

import id.my.hendisantika.config.LiveKitProperties;
import id.my.hendisantika.config.OpenApiConfig;
import id.my.hendisantika.room.dto.TokenRequest;
import id.my.hendisantika.room.dto.TokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
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
@RestController
@RequestMapping("/api/rooms")
@Tag(name = "Rooms", description = "Token LiveKit dan pengaturan peserta kelas live")
@ApiResponse(responseCode = "400", description = "Nama room, identity, atau body tidak valid",
        content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
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
    @Operation(summary = "Buat token LiveKit",
            description = "Token untuk bergabung ke room. Role default VIEWER; HOST dan CO_HOST wajib header X-Host-Key.")
    @ApiResponse(responseCode = "200", description = "Token berhasil dibuat")
    @ApiResponse(responseCode = "403", description = "Host key salah atau tidak dikirim untuk role HOST / CO_HOST",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    public TokenResponse createToken(@Parameter(description = "Nama room", example = "kelas-1")
                                     @PathVariable @Pattern(regexp = ROOM_PATTERN) String room,
                                     @Parameter(description = "Kunci host, wajib untuk role HOST / CO_HOST")
                                     @RequestHeader(name = "X-Host-Key", required = false) String hostKey,
                                     @Valid @RequestBody TokenRequest request) {
        if (request.roleOrDefault().requiresHostKey() && !isValidHostKey(hostKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Host key tidak valid untuk role " + request.roleOrDefault());
        }
        return tokenService.createToken(room, request);
    }

    @PostMapping("/{room}/participants/{identity}/promote")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Izinkan peserta bicara", description = "Memberi peserta izin mic & kamera (tanpa share screen) untuk tanya jawab. Hanya HOST room tersebut.",
            security = @SecurityRequirement(name = OpenApiConfig.HOST_TOKEN_SCHEME))
    @ApiResponse(responseCode = "204", description = "Berhasil")
    @ApiResponse(responseCode = "401", description = "Token host tidak ada atau tidak valid",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "403", description = "Token bukan milik HOST room ini",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Peserta tidak ada di room",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    public void promote(@Parameter(description = "Nama room", example = "kelas-1")
                        @PathVariable @Pattern(regexp = ROOM_PATTERN) String room,
                        @Parameter(description = "Identity peserta", example = "siswa-1")
                        @PathVariable @Pattern(regexp = IDENTITY_PATTERN) String identity,
                        @Parameter(hidden = true)
                        @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        hostTokenVerifier.verifyHost(authorization, room);
        participantService.promote(room, identity);
    }

    @PostMapping("/{room}/participants/{identity}/demote")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Kembalikan jadi peserta", description = "Mencabut izin publish; track peserta otomatis dilepas. Hanya HOST room tersebut.",
            security = @SecurityRequirement(name = OpenApiConfig.HOST_TOKEN_SCHEME))
    @ApiResponse(responseCode = "204", description = "Berhasil")
    @ApiResponse(responseCode = "401", description = "Token host tidak ada atau tidak valid",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "403", description = "Token bukan milik HOST room ini",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Peserta tidak ada di room",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    public void demote(@Parameter(description = "Nama room", example = "kelas-1")
                       @PathVariable @Pattern(regexp = ROOM_PATTERN) String room,
                       @Parameter(description = "Identity peserta", example = "siswa-1")
                       @PathVariable @Pattern(regexp = IDENTITY_PATTERN) String identity,
                       @Parameter(hidden = true)
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
