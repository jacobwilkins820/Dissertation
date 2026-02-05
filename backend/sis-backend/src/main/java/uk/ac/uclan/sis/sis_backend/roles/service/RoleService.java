package uk.ac.uclan.sis.sis_backend.roles.service;

import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.roles.repository.RoleRepository;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.roles.dto.CreateRoleRequest;
import uk.ac.uclan.sis.sis_backend.roles.dto.RoleResponse;
import uk.ac.uclan.sis.sis_backend.roles.dto.UpdateRoleRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.util.List;

@Service
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;
    private final AuthorizationService authorizationService;

    /**
     * Creates the role service.
     *
     * @param roleRepository repository for role access
     * @param authorizationService service for permission checks
     */
    public RoleService(RoleRepository roleRepository, AuthorizationService authorizationService) {
        this.roleRepository = roleRepository;
        this.authorizationService = authorizationService;
    }

    /**
     * Returns all roles.
     *
     * @return list of role responses
     */
    @Transactional(readOnly = true)
    public List<RoleResponse> getAll() {
        authorizationService.requireAdmin(currentUser());
        return roleRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns a role by id.
     *
     * @param id role id
     * @return role response
     */
    @Transactional(readOnly = true)
    public RoleResponse getById(Long id) {
        authorizationService.requireAdmin(currentUser());
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permissions", "Role not found: " + id));
        return toResponse(role);
    }

    /**
     * Returns a role entity by name.
     *
     * @param name role name
     * @return role entity
     */
    @Transactional(readOnly = true)
    public Role getEntityByName(String name) {
        authorizationService.requireAdmin(currentUser());
        return roleRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new NotFoundException("Permissions","Role not found: " + name));
    }

    /**
     * Creates a role.
     *
     * @param request create request payload
     * @return created role response
     */
    public RoleResponse create(CreateRoleRequest request) {
        authorizationService.requireAdmin(currentUser());
        if (roleRepository.existsByNameIgnoreCase(request.name())) {
            // Consider a conflict-specific exception when available.
            throw new IllegalArgumentException("Role already exists: " + request.name());
        }
        Role role = new Role(request.name().trim().toUpperCase(), request.permissionLevel());
        return toResponse(roleRepository.save(role));
    }

    /**
     * Updates a role by id.
     *
     * @param id role id
     * @param request update request payload
     * @return updated role response
     */
    public RoleResponse update(Long id, UpdateRoleRequest request) {
        authorizationService.requireAdmin(currentUser());
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permissions","Role not found: " + id));

        role.setName(request.name().trim().toUpperCase());
        role.setPermissionLevel(request.permissionLevel());

        return toResponse(roleRepository.save(role));
    }

    /**
     * Deletes a role by id.
     *
     * @param id role id
     */
    public void delete(Long id) {
        authorizationService.requireAdmin(currentUser());
        if (!roleRepository.existsById(id)) {
            throw new NotFoundException("Permissions","Role not found: " + id);
        }
        roleRepository.deleteById(id);
    }

    /**
     * Maps a role entity to a response.
     *
     * @param role role entity
     * @return role response
     */
    private RoleResponse toResponse(Role role) {
        return new RoleResponse(role.getId(), role.getName(), role.getPermissionLevel());
    }

    /**
     * Returns the current authenticated user.
     *
     * @return current user principal
     */
    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }
}
