package uk.ac.uclan.sis.sis_backend.roles.repository;

import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    /**
     * Finds a role by name (case-insensitive).
     *
     * @param name role name
     * @return matching role, when present
     */
    Optional<Role> findByNameIgnoreCase(String name);

    /**
     * Gets true when a role name already exists (case-insensitive).
     *
     * @param name role name
     * @return true when role exists
     */
    boolean existsByNameIgnoreCase(String name);
}
