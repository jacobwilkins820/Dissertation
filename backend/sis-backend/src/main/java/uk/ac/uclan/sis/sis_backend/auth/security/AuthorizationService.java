package uk.ac.uclan.sis.sis_backend.auth.security;

import org.springframework.stereotype.Service;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.common.exception.ForbiddenException;

@Service
public class AuthorizationService {

    public void require(User user, int permission) {
        int mask = user.getRole().getPermissionLevel();
        if (!Permissions.has(mask, permission)) {
            throw new ForbiddenException("User permission", "User does not have required permission: " + permission);
        }
    }
}
