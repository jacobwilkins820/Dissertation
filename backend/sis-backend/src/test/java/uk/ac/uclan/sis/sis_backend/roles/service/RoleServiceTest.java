package uk.ac.uclan.sis.sis_backend.roles.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.roles.dto.CreateRoleRequest;
import uk.ac.uclan.sis.sis_backend.roles.dto.RoleResponse;
import uk.ac.uclan.sis.sis_backend.roles.dto.UpdateRoleRequest;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.roles.repository.RoleRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private RoleService service;

    @Test
    void getAll_mapsToResponses() {
        Role role = new Role("ADMIN", 7);
        ReflectionTestUtils.setField(role, "id", 1L);

        when(roleRepository.findAll()).thenReturn(List.of(role));

        List<RoleResponse> result = service.getAll();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).id());
        assertEquals("ADMIN", result.get(0).name());
        assertEquals(7, result.get(0).permissionLevel());
    }

    @Test
    void getById_missingThrows() {
        when(roleRepository.findById(9L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getById(9L));
    }

    @Test
    void getById_returnsResponse() {
        Role role = new Role("TEACHER", 3);
        ReflectionTestUtils.setField(role, "id", 2L);

        when(roleRepository.findById(2L)).thenReturn(Optional.of(role));

        RoleResponse response = service.getById(2L);

        assertEquals(2L, response.id());
        assertEquals("TEACHER", response.name());
        assertEquals(3, response.permissionLevel());
    }

    @Test
    void getEntityByName_missingThrows() {
        when(roleRepository.findByNameIgnoreCase("admin")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getEntityByName("admin"));
    }

    @Test
    void getEntityByName_returnsRole() {
        Role role = new Role("ADMIN", 7);
        when(roleRepository.findByNameIgnoreCase("admin")).thenReturn(Optional.of(role));

        Role result = service.getEntityByName("admin");

        assertEquals("ADMIN", result.getName());
    }

    @Test
    void create_duplicateThrows() {
        CreateRoleRequest req = new CreateRoleRequest("admin", 3);

        when(roleRepository.existsByNameIgnoreCase("admin")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void create_trimsAndUppercasesName() {
        CreateRoleRequest req = new CreateRoleRequest(" admin ", 5);

        when(roleRepository.existsByNameIgnoreCase(" admin ")).thenReturn(false);
        when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> {
            Role saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 7L);
            return saved;
        });

        RoleResponse response = service.create(req);

        assertEquals(7L, response.id());
        assertEquals("ADMIN", response.name());
        assertEquals(5, response.permissionLevel());
    }

    @Test
    void update_missingThrows() {
        UpdateRoleRequest req = new UpdateRoleRequest("teacher", 2);

        when(roleRepository.findById(5L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.update(5L, req));
    }

    @Test
    void update_updatesFields() {
        Role role = new Role("OLD", 1);
        ReflectionTestUtils.setField(role, "id", 4L);

        UpdateRoleRequest req = new UpdateRoleRequest(" teacher ", 9);

        when(roleRepository.findById(4L)).thenReturn(Optional.of(role));
        when(roleRepository.save(role)).thenReturn(role);

        RoleResponse response = service.update(4L, req);

        assertEquals("TEACHER", role.getName());
        assertEquals(9, role.getPermissionLevel());
        assertEquals(4L, response.id());
        assertEquals("TEACHER", response.name());
        assertEquals(9, response.permissionLevel());
    }

    @Test
    void delete_missingThrows() {
        when(roleRepository.existsById(3L)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> service.delete(3L));
        verify(roleRepository, never()).deleteById(anyLong());
    }

    @Test
    void delete_existingDeletes() {
        when(roleRepository.existsById(3L)).thenReturn(true);

        service.delete(3L);

        verify(roleRepository).deleteById(3L);
    }
}
