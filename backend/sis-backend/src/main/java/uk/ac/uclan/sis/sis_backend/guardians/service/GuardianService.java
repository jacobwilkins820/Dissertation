package uk.ac.uclan.sis.sis_backend.guardians.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.common.exception.ForbiddenException;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianContactResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianSearchResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.UpdateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;
import uk.ac.uclan.sis.sis_backend.guardians.mapper.GuardianMapper;
import uk.ac.uclan.sis.sis_backend.guardians.repository.GuardianRepository;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.util.List;

@Service
public class GuardianService {

    private final GuardianRepository guardianRepository;
    private final AuthorizationService authorizationService;

    public GuardianService(
            GuardianRepository guardianRepository,
            AuthorizationService authorizationService
    ) {
        this.guardianRepository = guardianRepository;
        this.authorizationService = authorizationService;
    }

    @Transactional
    public CreateGuardianResponse create(CreateGuardianRequest request) {
        authorizationService.requireAdmin(currentUser());
        Guardian guardian = GuardianMapper.toEntity(request);
        Guardian saved = guardianRepository.save(guardian);

        // Return a small response.
        return new CreateGuardianResponse(saved.getId(), saved.getFirstName(), saved.getLastName());
    }

    @Transactional(readOnly = true)
    public GuardianResponse getById(Long id) {
        User user = currentUser();
        requireAdminOrSelf(user, id);
        Guardian guardian = guardianRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Guardian", "id " + id + " not found"));

        return GuardianMapper.response(guardian);
    }

    @Transactional(readOnly = true)
    public GuardianContactResponse getContactById(Long id) {
        authorizationService.require(currentUser(), Permissions.VIEW_GUARDIAN_CONTACT);
        Guardian guardian = guardianRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Guardian", "id " + id + " not found"));
        return GuardianMapper.contactResponse(guardian);
    }

    /**
     * Admin list view (paged).
     */
    @Transactional(readOnly = true)
    public Page<GuardianResponse> list(String q, Pageable pageable) {
        authorizationService.requireAdmin(currentUser());

        if (q == null || q.trim().isEmpty()) {
            return guardianRepository.findAll(pageable).map(GuardianMapper::response);
        }

        String term = q.trim();
        // Uses the unified repository search(query, pageable)
        return guardianRepository.search(term, pageable).map(GuardianMapper::response);
    }

    /**
     * Lightweight search for linking during user creation.
     * GET /api/guardians?query=<text>
     *
     * Returns a small capped list.
     */
    @Transactional(readOnly = true)
    public List<GuardianSearchResponse> search(String query) {
        User user = currentUser();
        if (!isAdmin(user)) {
            authorizationService.require(user, Permissions.VIEW_GUARDIAN_CONTACT);
        }

        if (query == null) return List.of();
        String q = query.trim();
        if (q.isEmpty() || q.length() < 2) return List.of();

        Pageable limit = PageRequest.of(0, 20);

        return guardianRepository.search(q, limit)
                .map(GuardianMapper::searchResponse)
                .getContent();
    }

    @Transactional
    public CreateGuardianResponse update(Long id, UpdateGuardianRequest request) {
        User user = currentUser();
        requireAdminOrSelf(user, id);
        Guardian guardian = guardianRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Guardian", "id " + id + " not found"));

        GuardianMapper.applyUpdate(guardian, request);
        Guardian saved = guardianRepository.save(guardian);

        return new CreateGuardianResponse(saved.getId(), saved.getFirstName(), saved.getLastName());
    }

    @Transactional
    public void delete(Long id) {
        authorizationService.requireAdmin(currentUser());

        if (!guardianRepository.existsById(id)) {
            throw new NotFoundException("Guardian", "id " + id + " not found");
        }

        guardianRepository.deleteById(id);
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }

    private boolean isAdmin(User user) {
        String roleName = user.getRole() == null ? null : user.getRole().getName();
        return roleName != null && roleName.equalsIgnoreCase("ADMIN");
    }

    private void requireAdminOrSelf(User user, Long guardianId) {
        if (isAdmin(user)) {
            return;
        }

        Long linkedGuardianId = user.getLinkedGuardianId();
        if (linkedGuardianId != null
                && linkedGuardianId.equals(guardianId)
                && Permissions.has(user.getRole().getPermissionLevel(), Permissions.EDIT_GUARDIAN_SELF)) {
            return;
        }

        throw new ForbiddenException("Guardian", "Not allowed to access this guardian");
    }
}
