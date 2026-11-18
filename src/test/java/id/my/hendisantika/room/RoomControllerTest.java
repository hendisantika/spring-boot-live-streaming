package id.my.hendisantika.room;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class RoomControllerTest {

    private final LiveKitTokenService tokenService = new LiveKitTokenService(LiveKitTokenServiceTest.PROPS);
    private final ParticipantService participantService = mock(ParticipantService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        RoomController controller = new RoomController(tokenService, LiveKitTokenServiceTest.PROPS,
                new HostTokenVerifier(LiveKitTokenServiceTest.PROPS), participantService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private String bearer(ParticipantRole role) {
        return "Bearer " + tokenService.createToken("kelas-1",
                new id.my.hendisantika.room.dto.TokenRequest("user-1", null, role)).token();
    }

    @Test
    void hostCanPromoteAndDemote() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/participants/siswa-1/promote")
                        .header("Authorization", bearer(ParticipantRole.HOST)))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/rooms/kelas-1/participants/siswa-1/demote")
                        .header("Authorization", bearer(ParticipantRole.HOST)))
                .andExpect(status().isNoContent());

        verify(participantService).promote("kelas-1", "siswa-1");
        verify(participantService).demote("kelas-1", "siswa-1");
    }

    @Test
    void viewerCannotPromote() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/participants/siswa-1/promote")
                        .header("Authorization", bearer(ParticipantRole.VIEWER)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/rooms/kelas-1/participants/siswa-1/promote"))
                .andExpect(status().isUnauthorized());

        verify(participantService, never()).promote("kelas-1", "siswa-1");
    }

    @Test
    void viewerGetsTokenWithoutHostKey() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/token").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identity\":\"siswa-1\",\"role\":\"VIEWER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("VIEWER"))
                .andExpect(jsonPath("$.room").value("kelas-1"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void hostWithoutHostKeyIsForbidden() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/token").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identity\":\"guru-1\",\"role\":\"HOST\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void hostWithWrongHostKeyIsForbidden() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/token").contentType(MediaType.APPLICATION_JSON)
                        .header("X-Host-Key", "salah")
                        .content("{\"identity\":\"guru-1\",\"role\":\"CO_HOST\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void hostWithValidHostKeyGetsToken() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/token").contentType(MediaType.APPLICATION_JSON)
                        .header("X-Host-Key", "host-key")
                        .content("{\"identity\":\"guru-1\",\"role\":\"HOST\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("HOST"));
    }

    @Test
    void invalidRoomNameIsBadRequest() throws Exception {
        mockMvc.perform(post("/api/rooms/bad room!/token").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identity\":\"siswa-1\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidIdentityOnPromoteIsBadRequest() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/participants/bad id!/promote")
                        .header("Authorization", bearer(ParticipantRole.HOST)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void blankIdentityIsRejected() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/token").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identity\":\"\"}"))
                .andExpect(status().isBadRequest());
    }
}
