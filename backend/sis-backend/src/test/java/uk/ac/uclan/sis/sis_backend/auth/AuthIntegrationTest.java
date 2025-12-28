package uk.ac.uclan.sis.sis_backend.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.students.repository.StudentRepository;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.users.repository.UserRepository;

@SpringBootTest(
        classes = AuthIntegrationTest.TestApp.class,
        properties = {
                "jwt.secret=TestSecretTestSecretTestSecretTestSecret",
                "jwt.issuer=sis-backend",
                "jwt.ttl-minutes=60",
                "spring.autoconfigure.exclude="
                        + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                        + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                        + "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
        }
)
@AutoConfigureMockMvc
@Import(AuthIntegrationTest.TestTxConfig.class)
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private StudentRepository studentRepository;

    private User viewer;
    private User admin;

    @BeforeEach
    void setUpMocks() {
        Role viewerRole = new Role("VIEWER", Permissions.VIEW_STUDENT_DIRECTORY);
        Role adminRole = new Role("ADMIN", 1023);

        viewer = new User();
        viewer.setId(1L);
        viewer.setEmail("viewer@example.com");
        viewer.setPasswordHash(passwordEncoder.encode("viewerpass"));
        viewer.setEnabled(true);
        viewer.setRole(viewerRole);

        admin = new User();
        admin.setId(2L);
        admin.setEmail("admin@example.com");
        admin.setPasswordHash(passwordEncoder.encode("adminpass"));
        admin.setEnabled(true);
        admin.setRole(adminRole);

        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByIdWithRole(anyLong())).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("viewer@example.com")).thenReturn(Optional.of(viewer));
        when(userRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(admin));
        when(userRepository.findByIdWithRole(1L)).thenReturn(Optional.of(viewer));
        when(userRepository.findByIdWithRole(2L)).thenReturn(Optional.of(admin));

        when(studentRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));
        when(studentRepository.existsByUpn(anyString())).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student student = invocation.getArgument(0);
            ReflectionTestUtils.setField(student, "id", 10L);
            return student;
        });
    }

    @Test
    void viewer_can_list_but_cannot_create_students() throws Exception {
        String token = login("viewer@example.com", "viewerpass");

        mockMvc.perform(get("/api/v1/students")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/students")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createStudentJson("U1")))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_can_create_students() throws Exception {
        String token = login("admin@example.com", "adminpass");

        mockMvc.perform(post("/api/v1/students")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createStudentJson("U2")))
                .andExpect(status().isCreated());
    }

    private String login(String email, String password) throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
                "email", email,
                "password", password
        ));

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("token").asText();
    }

    private String createStudentJson(String upn) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "upn", upn,
                "firstName", "Ada",
                "lastName", "Lovelace",
                "dateOfBirth", "2008-01-01",
                "gender", "F",
                "status", "ACTIVE"
        ));
    }

    @Configuration
    static class TestTxConfig {
        @Bean
        PlatformTransactionManager transactionManager() {
            return new PlatformTransactionManager() {
                @Override
                public TransactionStatus getTransaction(TransactionDefinition definition) {
                    return new SimpleTransactionStatus();
                }

                @Override
                public void commit(TransactionStatus status) {
                    // no-op
                }

                @Override
                public void rollback(TransactionStatus status) {
                    // no-op
                }
            };
        }
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @ComponentScan(basePackages = {
            "uk.ac.uclan.sis.sis_backend.auth",
            "uk.ac.uclan.sis.sis_backend.config",
            "uk.ac.uclan.sis.sis_backend.students"
    })
    static class TestApp {
    }
}
