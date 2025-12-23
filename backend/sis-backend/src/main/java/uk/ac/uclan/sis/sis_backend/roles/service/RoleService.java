package uk.ac.uclan.sis.sis_backend.roles.service;

import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.roles.repository.RoleRepository;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.roles.dto.CreateRoleRequest;
import uk.ac.uclan.sis.sis_backend.roles.dto.RoleResponse;
import uk.ac.uclan.sis.sis_backend.roles.dto.UpdateRoleRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> getAll() {
        return roleRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoleResponse getById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permissions", "Role not found: " + id));
        return toResponse(role);
    }

    @Transactional(readOnly = true)
    public Role getEntityByName(String name) {
        return roleRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new NotFoundException("Permissions","Role not found: " + name));
    }

    public RoleResponse create(CreateRoleRequest request) {
        if (roleRepository.existsByNameIgnoreCase(request.name())) {
            // You can swap this to a proper ConflictException if you have one
            throw new IllegalArgumentException("Role already exists: " + request.name());
        }
        Role role = new Role(request.name().trim().toUpperCase(), request.permissionLevel());
        return toResponse(roleRepository.save(role));
    }

    public RoleResponse update(Long id, UpdateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permissions","Role not found: " + id));

        role.setName(request.name().trim().toUpperCase());
        role.setPermissionLevel(request.permissionLevel());

        return toResponse(roleRepository.save(role));
    }

    public void delete(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new NotFoundException("Permissions","Role not found: " + id);
        }
        roleRepository.deleteById(id);
    }

    private RoleResponse toResponse(Role role) {
        return new RoleResponse(role.getId(), role.getName(), role.getPermissionLevel());
    }
}
