package uk.ac.uclan.sis.sis_backend.auth.security;

import org.springframework.stereotype.Service;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.common.exception.ForbiddenException;

@Service
public class AuthorizationService {

    /**
     * Requires the user to have a specific permission bit.
     *
     * @param user logged-in user
     * @param permission permission to check
     */
    public void require(User user, int permission) {
        // Permission mask is derived from the role.
        int mask = user.getRole().getPermissionLevel();
        if (!Permissions.has(mask, permission)) {
            throw new ForbiddenException("User permission", "User does not have required permission: " + permission);
        }
    }

    /**
     * Requires the user to have the ADMIN role.
     *
     * @param user logged-in user
     */
    public void requireAdmin(User user) {
        String roleName = user.getRole() == null ? null : user.getRole().getName();
        if (roleName == null || !roleName.equalsIgnoreCase("ADMIN")) {
            throw new ForbiddenException("User permission", "Admin role required");
        }
    }
}
