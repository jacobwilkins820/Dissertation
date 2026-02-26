package uk.ac.uclan.sis.sis_backend.guardians.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.audit_log.service.AuditLogService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.UpdateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;
import uk.ac.uclan.sis.sis_backend.guardians.repository.GuardianRepository;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GuardianServiceTest {

    @Mock
    private GuardianRepository guardianRepository;

    @Mock
    private AuthorizationService authorizationService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private GuardianService service;

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
    void create_mapsAndSavesGuardian() {
        CreateGuardianRequest req = new CreateGuardianRequest();
        req.setFirstName("  Alice ");
        req.setLastName("  Smith ");
        req.setEmail("  Alice@Example.COM ");
        req.setPhone(" 123 ");
        req.setAddressLine1("  1 High St ");
        req.setAddressLine2(" ");
        req.setCity("  Preston ");
        req.setPostcode(" PR1 ");

        when(guardianRepository.save(any(Guardian.class))).thenAnswer(invocation -> {
            Guardian saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 10L);
            return saved;
        });

        CreateGuardianResponse response = service.create(req);

        ArgumentCaptor<Guardian> captor = ArgumentCaptor.forClass(Guardian.class);
        verify(guardianRepository).save(captor.capture());

        Guardian saved = captor.getValue();
        assertEquals("Alice", saved.getFirstName());
        assertEquals("Smith", saved.getLastName());
        assertEquals("alice@example.com", saved.getEmail());
        assertEquals("123", saved.getPhone());
        assertEquals("1 High St", saved.getAddressLine1());
        assertNull(saved.getAddressLine2());
        assertEquals("Preston", saved.getCity());
        assertEquals("PR1", saved.getPostcode());

        assertEquals(10L, response.getId());
        assertEquals("Alice", response.getFirstName());
        assertEquals("Smith", response.getLastName());
    }

    @Test
    void getById_missingThrows() {
        when(guardianRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getById(7L));
    }

    @Test
    void getById_returnsResponse() {
        Guardian guardian = buildGuardian(5L, "Alan", "Turing");
        guardian.setEmail("alan@example.com");
        guardian.setPhone("555");
        guardian.setCity("Lancaster");
        ReflectionTestUtils.setField(guardian, "createdAt", Instant.parse("2024-01-01T00:00:00Z"));
        ReflectionTestUtils.setField(guardian, "updatedAt", Instant.parse("2024-01-02T00:00:00Z"));

        when(guardianRepository.findById(5L)).thenReturn(Optional.of(guardian));

        GuardianResponse response = service.getById(5L);

        assertEquals(5L, response.getId());
        assertEquals("Alan", response.getFirstName());
        assertEquals("Turing", response.getLastName());
        assertEquals("alan@example.com", response.getEmail());
        assertEquals("555", response.getPhone());
        assertEquals("Lancaster", response.getCity());
        assertEquals(Instant.parse("2024-01-01T00:00:00Z"), response.getCreatedAt());
    }

    @Test
    void list_withoutQueryUsesFindAll() {
        Guardian guardian = buildGuardian(1L, "Ada", "Lovelace");
        Pageable pageable = PageRequest.of(0, 10);
        Page<Guardian> page = new PageImpl<>(List.of(guardian), pageable, 1);

        when(guardianRepository.findAll(pageable)).thenReturn(page);

        Page<GuardianResponse> result = service.list(null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Ada", result.getContent().get(0).getFirstName());
        verify(guardianRepository, never()).search(anyString(), any(Pageable.class));
    }

    @Test
    void list_withQueryUsesSearch() {
        Guardian guardian = buildGuardian(2L, "Grace", "Hopper");
        Pageable pageable = PageRequest.of(0, 10);
        Page<Guardian> page = new PageImpl<>(List.of(guardian), pageable, 1);

        when(guardianRepository.search("smith", pageable)).thenReturn(page);

        Page<GuardianResponse> result = service.list("  smith  ", pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Grace", result.getContent().get(0).getFirstName());
        verify(guardianRepository, never()).findAll(pageable);
    }

    @Test
    void update_updatesFieldsAndReturnsResponse() {
        Guardian guardian = buildGuardian(3L, "Old", "Name");

        UpdateGuardianRequest req = new UpdateGuardianRequest();
        req.setFirstName("  New ");
        req.setLastName("  Name ");
        req.setEmail(" NEW@EXAMPLE.COM ");
        req.setPhone(" 987 ");
        req.setAddressLine1(" 10 Road ");
        req.setAddressLine2(" ");
        req.setCity("  Preston ");
        req.setPostcode(" PR2 ");

        when(guardianRepository.findById(3L)).thenReturn(Optional.of(guardian));
        when(guardianRepository.save(guardian)).thenReturn(guardian);

        CreateGuardianResponse response = service.update(3L, req);

        assertEquals("New", guardian.getFirstName());
        assertEquals("Name", guardian.getLastName());
        assertEquals("new@example.com", guardian.getEmail());
        assertEquals("987", guardian.getPhone());
        assertEquals("10 Road", guardian.getAddressLine1());
        assertNull(guardian.getAddressLine2());
        assertEquals("Preston", guardian.getCity());
        assertEquals("PR2", guardian.getPostcode());

        assertEquals(3L, response.getId());
        assertEquals("New", response.getFirstName());
        assertEquals("Name", response.getLastName());
    }

    @Test
    void update_missingThrows() {
        UpdateGuardianRequest req = new UpdateGuardianRequest();
        req.setFirstName("A");
        req.setLastName("B");

        when(guardianRepository.findById(9L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.update(9L, req));
    }

    @Test
    void delete_missingThrows() {
        when(guardianRepository.findById(8L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.delete(8L));
        verify(guardianRepository, never()).deleteById(anyLong());
    }

    @Test
    void delete_existingDeletes() {
        when(guardianRepository.findById(8L)).thenReturn(Optional.of(buildGuardian(8L, "Ada", "Lovelace")));

        service.delete(8L);

        verify(guardianRepository).deleteById(8L);
    }

    private Guardian buildGuardian(Long id, String firstName, String lastName) {
        Guardian guardian = new Guardian();
        guardian.setFirstName(firstName);
        guardian.setLastName(lastName);
        ReflectionTestUtils.setField(guardian, "id", id);
        return guardian;
    }
}
