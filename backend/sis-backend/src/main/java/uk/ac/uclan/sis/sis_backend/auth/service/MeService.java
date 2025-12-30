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

    public MeService(UserRepository userRepository, GuardianRepository guardianRepository) {
        this.userRepository = userRepository;
        this.guardianRepository = guardianRepository;
    }

    public MeResponse getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Unauthenticated");
        }

        Object principal = auth.getPrincipal();

        User userPrinciple = (User) principal; // Cast principal to User
        String email = userPrinciple.getEmail();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User", "User not found"));

        // If the User has a Long field:
        Long linkedGuardianId = user.getLinkedGuardianId(); // nullable

        // Defensive check
        if (linkedGuardianId != null && !guardianRepository.existsById(linkedGuardianId)) {
            linkedGuardianId = null;
        }

        String roleName = user.getRole() != null ? user.getRole().getName() : null;

        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roleName,
                linkedGuardianId
        );
    }
}
