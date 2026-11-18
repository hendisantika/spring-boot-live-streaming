package id.my.hendisantika.room;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

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

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        RoomController controller = new RoomController(new LiveKitTokenService(LiveKitTokenServiceTest.PROPS),
                LiveKitTokenServiceTest.PROPS);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
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
    void blankIdentityIsRejected() throws Exception {
        mockMvc.perform(post("/api/rooms/kelas-1/token").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identity\":\"\"}"))
                .andExpect(status().isBadRequest());
    }
}
