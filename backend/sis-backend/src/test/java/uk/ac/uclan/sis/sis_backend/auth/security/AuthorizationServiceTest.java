package uk.ac.uclan.sis.sis_backend.auth.security;

import org.junit.jupiter.api.Test;
import uk.ac.uclan.sis.sis_backend.common.exception.ForbiddenException;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthorizationServiceTest {

    private final AuthorizationService authorizationService = new AuthorizationService();

    @Test
    void require_allowsWhenPermissionPresent() {
        User user = buildUser(Permissions.VIEW_ATTENDANCE | Permissions.EDIT_ATTENDANCE);

        assertDoesNotThrow(() -> authorizationService.require(user, Permissions.EDIT_ATTENDANCE));
    }

    @Test
    void require_throwsWhenPermissionMissing() {
        User user = buildUser(Permissions.VIEW_ATTENDANCE);

        assertThrows(ForbiddenException.class,
                () -> authorizationService.require(user, Permissions.EDIT_ATTENDANCE));
    }

    private User buildUser(int permissionLevel) {
        Role role = new Role("TEACHER", permissionLevel);
        User user = new User();
        user.setRole(role);
        return user;
    }
}
