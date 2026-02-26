package uk.ac.uclan.sis.sis_backend.users.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.audit_log.service.AuditLogService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.guardians.repository.GuardianRepository;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.roles.repository.RoleRepository;
import uk.ac.uclan.sis.sis_backend.users.dto.CreateUserRequest;
import uk.ac.uclan.sis.sis_backend.users.dto.UpdateUserRequest;
import uk.ac.uclan.sis.sis_backend.users.dto.UserDetailResponse;
import uk.ac.uclan.sis.sis_backend.users.dto.UserListItemResponse;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.users.repository.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private GuardianRepository guardianRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthorizationService authorizationService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUpSecurityContext() {
        Role role = new Role("ADMIN", 1023);
        User user = new User();
        user.setId(1L);
        user.setRole(role);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void list_mapsUsersToListItems() {
        Role role = new Role("ADMIN", 1);
        User user = buildUser(1L, "user@example.com", role);

        when(userRepository.findAllWithRole()).thenReturn(List.of(user));

        List<UserListItemResponse> result = userService.list();

        assertEquals(1, result.size());
        UserListItemResponse item = result.get(0);
        assertEquals("user@example.com", item.email);
        assertTrue(item.enabled);
        assertEquals("ADMIN", item.roleName);
    }

    @Test
    void get_returnsDetail() {
        Role role = new Role("ADMIN", 1);
        User user = buildUser(10L, "user@example.com", role);
        user.setCreatedAt(Instant.parse("2024-01-01T00:00:00Z"));
        user.setUpdatedAt(Instant.parse("2024-01-02T00:00:00Z"));

        when(userRepository.findByIdWithRole(10L)).thenReturn(Optional.of(user));

        UserDetailResponse result = userService.get(10L);

        assertEquals(10L, result.id);
        assertEquals("user@example.com", result.email);
        assertEquals(role, result.role);
        assertTrue(result.enabled);
        assertEquals(user.getCreatedAt(), result.createdAt);
        assertEquals(user.getUpdatedAt(), result.updatedAt);
    }

    @Test
    void get_missingUserThrows() {
        when(userRepository.findByIdWithRole(99L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> userService.get(99L));
    }

    @Test
    void create_normalizesEmailAndEncodesPassword() {
        CreateUserRequest req = new CreateUserRequest();
        req.email = "  Test@Example.COM ";
        req.password = "password123";
        req.roleId = 5L;

        Role role = new Role("ADMIN", 1);

        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(roleRepository.findById(5L)).thenReturn(Optional.of(role));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(42L);
            return saved;
        });

        UserListItemResponse result = userService.create(req);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User saved = captor.getValue();
        assertEquals("test@example.com", saved.getEmail());
        assertEquals("hashed", saved.getPasswordHash());
        assertEquals(role, saved.getRole());
        assertTrue(saved.isEnabled());

        assertEquals("test@example.com", result.email);
        assertEquals("ADMIN", result.roleName);
    }

    @Test
    void create_duplicateEmailThrows() {
        CreateUserRequest req = new CreateUserRequest();
        req.email = "user@example.com";
        req.password = "password123";
        req.roleId = 1L;

        when(userRepository.existsByEmailIgnoreCase("user@example.com")).thenReturn(true);

        assertThrows(uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException.class, () -> userService.create(req));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void create_missingRoleThrows() {
        CreateUserRequest req = new CreateUserRequest();
        req.email = "user@example.com";
        req.password = "password123";
        req.roleId = 1L;

        when(roleRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException.class, () -> userService.create(req));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void update_changesEmailWhenDifferent() {
        Role role = new Role("ADMIN", 1);
        User user = buildUser(1L, "old@example.com", role);

        UpdateUserRequest req = new UpdateUserRequest();
        req.email = "new@example.com";

        when(userRepository.findByIdWithRole(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);

        userService.update(1L, req);

        assertEquals("new@example.com", user.getEmail());
        verify(userRepository).existsByEmailIgnoreCase("new@example.com");
    }

    @Test
    void update_sameEmailSkipsDuplicateCheck() {
        Role role = new Role("ADMIN", 1);
        User user = buildUser(1L, "old@example.com", role);

        UpdateUserRequest req = new UpdateUserRequest();
        req.email = "OLD@EXAMPLE.COM";

        when(userRepository.findByIdWithRole(1L)).thenReturn(Optional.of(user));

        userService.update(1L, req);

        assertEquals("old@example.com", user.getEmail());
        verify(userRepository, never()).existsByEmailIgnoreCase(anyString());
    }

    @Test
    void update_changesPasswordHash() {
        Role role = new Role("ADMIN", 1);
        User user = buildUser(1L, "user@example.com", role);

        UpdateUserRequest req = new UpdateUserRequest();
        req.password = "newpassword";

        when(userRepository.findByIdWithRole(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpassword")).thenReturn("hashed");

        userService.update(1L, req);

        assertEquals("hashed", user.getPasswordHash());
    }

    @Test
    void update_changesRole() {
        Role oldRole = new Role("ADMIN", 1);
        Role newRole = new Role("TEACHER", 2);
        User user = buildUser(1L, "user@example.com", oldRole);

        UpdateUserRequest req = new UpdateUserRequest();
        req.roleId = 99L;

        when(userRepository.findByIdWithRole(1L)).thenReturn(Optional.of(user));
        when(roleRepository.findById(99L)).thenReturn(Optional.of(newRole));

        userService.update(1L, req);

        assertEquals(newRole, user.getRole());
    }

    @Test
    void update_missingRoleThrows() {
        Role role = new Role("ADMIN", 1);
        User user = buildUser(1L, "user@example.com", role);

        UpdateUserRequest req = new UpdateUserRequest();
        req.roleId = 99L;

        when(userRepository.findByIdWithRole(1L)).thenReturn(Optional.of(user));
        when(roleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException.class, () -> userService.update(1L, req));
    }

    @Test
    void update_changesEnabledFlag() {
        Role role = new Role("ADMIN", 1);
        User user = buildUser(1L, "user@example.com", role);

        UpdateUserRequest req = new UpdateUserRequest();
        req.enabled = false;

        when(userRepository.findByIdWithRole(1L)).thenReturn(Optional.of(user));

        userService.update(1L, req);

        assertFalse(user.isEnabled());
    }

    @Test
    void update_missingUserThrows() {
        UpdateUserRequest req = new UpdateUserRequest();
        when(userRepository.findByIdWithRole(404L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> userService.update(404L, req));
    }

    @Test
    void delete_existingUserDeletes() {
        Role role = new Role("ADMIN", 1);
        User user = buildUser(5L, "user@example.com", role);
        when(userRepository.findByIdWithRole(5L)).thenReturn(Optional.of(user));

        userService.delete(5L);

        verify(userRepository).deleteById(5L);
    }

    @Test
    void delete_missingUserThrows() {
        when(userRepository.findByIdWithRole(5L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> userService.delete(5L));
        verify(userRepository, never()).deleteById(anyLong());
    }

    private User buildUser(Long id, String email, Role role) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setRole(role);
        user.setEnabled(true);
        return user;
    }
}
