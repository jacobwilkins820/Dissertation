package uk.ac.uclan.sis.sis_backend.auth.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import uk.ac.uclan.sis.sis_backend.auth.dto.MeResponse;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.guardians.repository.GuardianRepository;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.users.repository.UserRepository;

@Service
public class MeService {

    private final UserRepository userRepository;
    private final GuardianRepository guardianRepository;

    /**
     * Sets up the service for current-user lookups.
     *
     * @param userRepository repository for user access
     * @param guardianRepository repository for guardian links
     */
    public MeService(UserRepository userRepository, GuardianRepository guardianRepository) {
        this.userRepository = userRepository;
        this.guardianRepository = guardianRepository;
    }

    /**
     * Gets profile details for the logged-in user.
     *
     * @return current user response
     */
    public MeResponse getMe() {
        // Read authentication from the security context.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Unauthenticated");
        }

        Object principal = auth.getPrincipal();

        // Cast principal to User.
        User userPrinciple = (User) principal;
        String email = userPrinciple.getEmail();

        // Load the full user record.
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User", "User not found"));

        // Read linked guardian id if present.
        Long linkedGuardianId = user.getLinkedGuardianId();

        // Drop invalid guardian references.
        if (linkedGuardianId != null && !guardianRepository.existsById(linkedGuardianId)) {
            linkedGuardianId = null;
        }

        // Copy role details into the response.
        String roleName = user.getRole() != null ? user.getRole().getName() : null;
        Long roleId = user.getRole() != null ? user.getRole().getId() : null;
        long permissionLevel = user.getRole() != null ? user.getRole().getPermissionLevel() : 0L;

        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roleName,
                roleId,
                permissionLevel,
                linkedGuardianId
        );
    }
}
