package uk.ac.uclan.sis.sis_backend.users.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.audit_log.service.AuditLogService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;
import uk.ac.uclan.sis.sis_backend.guardians.repository.GuardianRepository;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.roles.repository.RoleRepository;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.users.dto.*;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.users.repository.UserRepository;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final GuardianRepository guardianRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthorizationService authorizationService;
    private final AuditLogService auditLogService;

    /**
     * Creates the user service with required dependencies.
     *
     * @param userRepository repository for user access
     * @param roleRepository repository for role access
     * @param passwordEncoder encoder for password hashing
     * @param authorizationService service for permission checks
     */
    public UserService(UserRepository userRepository,
                    GuardianRepository guardianRepository,
                    RoleRepository roleRepository,
                    PasswordEncoder passwordEncoder,
                    AuthorizationService authorizationService,
                    AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.guardianRepository = guardianRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authorizationService = authorizationService;
        this.auditLogService = auditLogService;
    }

    /**
     * Returns all users as list items.
     *
     * @return list of users
     */
    public List<UserListItemResponse> list() {
        authorizationService.requireAdmin(currentUser());
        return userRepository.findAllWithRole()
                .stream()
                .map(this::toListItem)
                .toList();
    }

    /**
     * Returns detailed user information by id.
     *
     * @param id user id
     * @return user details
     */
    public UserDetailResponse get(Long id) {
        authorizationService.requireAdmin(currentUser());
        User user = userRepository.findByIdWithRole(id)
                .orElseThrow(() -> new NotFoundException("user", "User not found: " + id));
        return toDetail(user);
    }


    /**
     * Creates a new user.
     *
     * @param req create request payload
     * @return created user list item
     */
    @Transactional
    public UserListItemResponse create(CreateUserRequest req) {
        authorizationService.require(currentUser(), Permissions.CREATE_USER);

        // email
        if (req.email == null || req.email.isBlank()) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "email", "Email is required"
            );
        }

        String normalizedEmail = normalizeEmail(req.email);

        if (!isValidEmail(normalizedEmail)) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "email", "Invalid email format"
            );
        }

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "email", "Email already in use"
            );
        }

        // password
        if (req.password == null || req.password.isBlank()) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "password", "Password is required"
            );
        }

        if (req.password.length() < 8) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "password", "Password must be at least 8 characters"
            );
        }

        // role
        if (req.roleId == null) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "roleId", "Role is required"
            );
        }

        Role role = roleRepository.findById(req.roleId)
                .orElseThrow(() ->
                        new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                                "roleId", "Role not found: " + req.roleId
                        )
                );

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.password));
        user.setRole(role);
        user.setFirstName(req.firstName);
        user.setLastName(req.lastName);
        user.setEnabled(req.enabled != null ? req.enabled : true);
        user.setLinkedGuardianId(req.linkedGuardianId);

        if (req.enabled != null) {
            user.setEnabled(req.enabled);
        }
        User saved = userRepository.save(user);
        auditLogService.log(
                null,
                "USER_CREATED",
                "USER",
                saved.getId(),
                "email=" + saved.getEmail() + ", role=" + saved.getRole().getName()
        );
        return toListItem(saved);
    }

    /**
     * Creates a guardian record and linked parent user in one transaction.
     *
     * @param req create request payload
     * @return created user list item
     */
    @Transactional
    public UserListItemResponse createGuardianUser(CreateGuardianUserRequest req) {
        authorizationService.require(currentUser(), Permissions.CREATE_USER);
        authorizationService.require(currentUser(), Permissions.CREATE_GUARDIAN);

        if (req.firstName == null || req.firstName.isBlank()) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "firstName", "First name is required"
            );
        }

        if (req.lastName == null || req.lastName.isBlank()) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "lastName", "Last name is required"
            );
        }

        if (req.email == null || req.email.isBlank()) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "email", "Email is required"
            );
        }

        String normalizedEmail = normalizeEmail(req.email);

        if (!isValidEmail(normalizedEmail)) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "email", "Invalid email format"
            );
        }

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "email", "Email already in use"
            );
        }

        if (req.password == null || req.password.isBlank()) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "password", "Password is required"
            );
        }

        if (req.password.length() < 8) {
            throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                    "password", "Password must be at least 8 characters"
            );
        }

        Role parentRole = roleRepository.findByNameIgnoreCase("PARENT")
                .orElseThrow(() ->
                        new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                                "roleId", "Role not found: PARENT"
                        )
                );

        Guardian guardian = new Guardian();
        guardian.setFirstName(req.firstName.trim());
        guardian.setLastName(req.lastName.trim());
        guardian.setEmail(normalizedEmail);
        guardian.setPhone(trimOrNull(req.phone));
        guardian.setAddressLine1(trimOrNull(req.addressLine1));
        guardian.setAddressLine2(trimOrNull(req.addressLine2));
        guardian.setCity(trimOrNull(req.city));
        guardian.setPostcode(trimOrNull(req.postcode));
        Guardian savedGuardian = guardianRepository.save(guardian);

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.password));
        user.setRole(parentRole);
        user.setFirstName(req.firstName.trim());
        user.setLastName(req.lastName.trim());
        user.setEnabled(true);
        user.setLinkedGuardianId(savedGuardian.getId());
        User saved = userRepository.save(user);

        auditLogService.log(
                null,
                "GUARDIAN_CREATED",
                "GUARDIAN",
                savedGuardian.getId(),
                "name=" + savedGuardian.getFirstName() + " " + savedGuardian.getLastName()
        );
        auditLogService.log(
                null,
                "USER_CREATED",
                "USER",
                saved.getId(),
                "email=" + saved.getEmail() + ", role=" + saved.getRole().getName()
        );

        return toListItem(saved);
    }

    /**
     * Updates an existing user.
     *
     * @param id user id
     * @param req update request payload
     * @return updated user list item
     */
    @Transactional
    public UserListItemResponse update(Long id, UpdateUserRequest req) {
    authorizationService.requireAdmin(currentUser());

        User user = userRepository.findByIdWithRole(id)
                .orElseThrow(() -> new NotFoundException("User", "User not found: " + id));
        // email (optional)
        if (req.email != null) {
            if (req.email.isBlank()) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "email", "Email must not be blank"
                );
            }

            String normalizedEmail = normalizeEmail(req.email);

            if (!isValidEmail(normalizedEmail)) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "email", "Invalid email format"
                );
            }

            boolean emailChanged = !normalizedEmail.equalsIgnoreCase(user.getEmail());
            if (emailChanged && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "email", "Email already in use"
                );
            }

            user.setEmail(normalizedEmail);
        }

        // password (optional)
        if (req.password != null) {
            if (req.password.isBlank()) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "password", "Password must not be blank"
                );
            }

            if (req.password.length() < 8) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "password", "Password must be at least 8 characters"
                );
            }

            user.setPasswordHash(passwordEncoder.encode(req.password));
        }

        // role (optional)
        if (req.roleId != null) {
            Role role = roleRepository.findById(req.roleId)
                    .orElseThrow(() ->
                            new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                                    "roleId", "Role not found: " + req.roleId
                            )
                    );
            user.setRole(role);
        }

        if (req.enabled != null) {
            user.setEnabled(req.enabled);
        }

        auditLogService.log(
                null,
                "USER_UPDATED",
                "USER",
                user.getId(),
                "email=" + user.getEmail() + ", role=" + user.getRole().getName() + ", enabled=" + user.isEnabled()
        );
        return toListItem(user);
    }

    /**
     * Updates the current authenticated user's profile details.
     *
     * @param req update request payload
     * @return updated user list item
     */
    @Transactional
    public UserListItemResponse updateCurrent(UpdateCurrentUserRequest req) {
        User current = currentUser();
        User user = userRepository.findByIdWithRole(current.getId())
                .orElseThrow(() -> new NotFoundException("User", "User not found: " + current.getId()));

        if (req.firstName != null) {
            String firstName = req.firstName.trim();
            if (firstName.isEmpty()) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "firstName", "First name must not be blank"
                );
            }
            user.setFirstName(firstName);
        }

        if (req.lastName != null) {
            String lastName = req.lastName.trim();
            if (lastName.isEmpty()) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "lastName", "Last name must not be blank"
                );
            }
            user.setLastName(lastName);
        }

        if (req.email != null) {
            if (req.email.isBlank()) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "email", "Email must not be blank"
                );
            }

            String normalizedEmail = normalizeEmail(req.email);
            if (!isValidEmail(normalizedEmail)) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "email", "Invalid email format"
                );
            }

            boolean emailChanged = !normalizedEmail.equalsIgnoreCase(user.getEmail());
            if (emailChanged && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new uk.ac.uclan.sis.sis_backend.common.exception.IllegalArgumentException(
                        "email", "Email already in use"
                );
            }

            user.setEmail(normalizedEmail);
        }

        auditLogService.log(
                null,
                "USER_SELF_UPDATED",
                "USER",
                user.getId(),
                "email=" + user.getEmail()
        );

        return toListItem(user);
    }

    /**
     * Deletes a user by id.
     *
     * @param id user id
     */
    @Transactional
    public void delete(Long id) {
        authorizationService.requireAdmin(currentUser());
        User user = userRepository.findByIdWithRole(id)
                .orElseThrow(() -> new NotFoundException("User","User not found: " + id));
        userRepository.deleteById(id);
        auditLogService.log(
                null,
                "USER_DELETED",
                "USER",
                id,
                "email=" + user.getEmail()
        );
    }

    /**
     * Normalizes email for consistent storage.
     *
     * @param email raw email
     * @return normalized email
     */
    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    /**
     * Maps a user to a list item response.
     *
     * @param u user entity
     * @return list item response
     */
    private UserListItemResponse toListItem(User u) {
        UserListItemResponse dto = new UserListItemResponse();
        dto.id = u.getId();
        dto.firstName = u.getFirstName();
        dto.lastName = u.getLastName();
        dto.email = u.getEmail();
        dto.enabled = u.isEnabled();
        dto.roleName = u.getRole().getName();
        return dto;
    }

    /**
     * Maps a user to a detail response.
     *
     * @param u user entity
     * @return detail response
     */
    private UserDetailResponse toDetail(User u) {
        UserDetailResponse dto = new UserDetailResponse();
        dto.id = u.getId();
        dto.email = u.getEmail();
        dto.enabled = u.isEnabled();
        dto.role = u.getRole();
        dto.createdAt = u.getCreatedAt();
        dto.updatedAt = u.getUpdatedAt();
        return dto;
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

    /**
     * Performs a basic email validity check.
     *
     * @param email email address
     * @return true when the email is minimally valid
     */
    private boolean isValidEmail(String email) {
    if (email == null) return false;
    String e = email.trim();
    if (e.isEmpty()) return false;

    // deliberately simple — avoids rejecting valid real-world emails
    return e.contains("@") && e.contains(".") && !e.contains(" ");
}

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

}
