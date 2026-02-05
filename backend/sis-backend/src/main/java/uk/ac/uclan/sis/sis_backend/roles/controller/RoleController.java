package uk.ac.uclan.sis.sis_backend.roles.controller;

import jakarta.validation.Valid;
import uk.ac.uclan.sis.sis_backend.roles.service.RoleService;
import uk.ac.uclan.sis.sis_backend.roles.dto.CreateRoleRequest;
import uk.ac.uclan.sis.sis_backend.roles.dto.RoleResponse;
import uk.ac.uclan.sis.sis_backend.roles.dto.UpdateRoleRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    /**
     * Creates the role controller.
     *
     * @param roleService service for role operations
     */
    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    /**
     * Returns all roles.
     *
     * @return list of role responses
     */
    @GetMapping
    public List<RoleResponse> getAll() {
        return roleService.getAll();
    }

    /**
     * Returns a role by id.
     *
     * @param id role id
     * @return role response
     */
    @GetMapping("/{id}")
    public RoleResponse getById(@PathVariable Long id) {
        return roleService.getById(id);
    }

    /**
     * Creates a role.
     *
     * @param request create request payload
     * @return created role response
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponse create(@Valid @RequestBody CreateRoleRequest request) {
        return roleService.create(request);
    }

    /**
     * Updates a role by id.
     *
     * @param id role id
     * @param request update request payload
     * @return updated role response
     */
    @PutMapping("/{id}")
    public RoleResponse update(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest request) {
        return roleService.update(id, request);
    }

    /**
     * Deletes a role by id.
     *
     * @param id role id
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        roleService.delete(id);
    }
}
