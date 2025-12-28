package uk.ac.uclan.sis.sis_backend.users.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.roles.repository.RoleRepository;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.users.dto.*;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.users.repository.UserRepository;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthorizationService authorizationService;

    public UserService(UserRepository userRepository,
                    RoleRepository roleRepository,
                    PasswordEncoder passwordEncoder,
                    AuthorizationService authorizationService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authorizationService = authorizationService;
    }

    public List<UserListItemResponse> list() {
        authorizationService.requireAdmin(currentUser());
        return userRepository.findAllWithRole()
                .stream()
                .map(this::toListItem)
                .toList();
    }

    public UserDetailResponse get(Long id) {
        authorizationService.requireAdmin(currentUser());
        User user = userRepository.findByIdWithRole(id)
                .orElseThrow(() -> new NotFoundException("user", "User not found: " + id));
        return toDetail(user);
    }


    @Transactional
    public UserListItemResponse create(CreateUserRequest req) {
        authorizationService.requireAdmin(currentUser());
        String normalizedEmail = normalizeEmail(req.email);

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.password)); // salted + hashed

        Role role = roleRepository.findById(req.roleId)
                .orElseThrow(() -> new NotFoundException("User Role", "Role not found: " + req.roleId));

        user.setRole(role);


        if (req.enabled != null) {
            user.setEnabled(req.enabled);
        } // else keep default true

        User saved = userRepository.save(user);
        return toListItem(saved);
    }

    @Transactional
    public UserListItemResponse update(Long id, UpdateUserRequest req) {
        authorizationService.requireAdmin(currentUser());
        User user = userRepository.findByIdWithRole(id)
                .orElseThrow(() -> new NotFoundException("User", "User not found: " + id));

        if (req.email != null && !req.email.isBlank()) {
            String normalizedEmail = normalizeEmail(req.email);
            boolean emailChanged = !normalizedEmail.equalsIgnoreCase(user.getEmail());
            if (emailChanged && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(normalizedEmail);
        }

        if (req.password != null && !req.password.isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password));
        }

        if (req.roleId != null) {
            Role role = roleRepository.findById(req.roleId)
                    .orElseThrow(() -> new NotFoundException("User Role", "Role not found: " + req.roleId));
            user.setRole(role);
        }

        if (req.enabled != null) {
            user.setEnabled(req.enabled);
        }

        return toListItem(user);
    }


    @Transactional
    public void delete(Long id) {
        authorizationService.requireAdmin(currentUser());
        if (!userRepository.existsById(id)) {
            throw new NotFoundException("User","User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private UserListItemResponse toListItem(User u) {
        UserListItemResponse dto = new UserListItemResponse();
        dto.id = u.getId();
        dto.email = u.getEmail();
        dto.enabled = u.isEnabled();
        dto.roleName = u.getRole().getName();
        return dto;
    }

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

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }
}
