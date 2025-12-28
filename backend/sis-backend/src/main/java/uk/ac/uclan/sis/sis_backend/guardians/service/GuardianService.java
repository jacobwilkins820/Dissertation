package uk.ac.uclan.sis.sis_backend.guardians.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianContactResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.UpdateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;
import uk.ac.uclan.sis.sis_backend.guardians.mapper.GuardianMapper;
import uk.ac.uclan.sis.sis_backend.guardians.repository.GuardianRepository;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

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
        authorizationService.requireAdmin(currentUser());
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

    @Transactional(readOnly = true)
    public Page<GuardianResponse> list(String q, Pageable pageable) {
        authorizationService.requireAdmin(currentUser());
        Page<Guardian> page;

        if (q == null || q.trim().isEmpty()) {
            // No search term → return all guardians (paged)
            page = guardianRepository.findAll(pageable);
        } else {
            // Search by first/last name (paged)
            String term = q.trim();
            page = guardianRepository.searchByName(term, pageable);
        }

        return page.map(GuardianMapper::response);
    }

    @Transactional
    public CreateGuardianResponse update(Long id, UpdateGuardianRequest request) {
        authorizationService.requireAdmin(currentUser());
        Guardian guardian = guardianRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Guardian", "id " + id + " not found"));

        GuardianMapper.applyUpdate(guardian, request);
        Guardian saved = guardianRepository.save(guardian);

        return new CreateGuardianResponse(saved.getId(), saved.getFirstName(), saved.getLastName());
    }

    @Transactional
    public void delete(Long id) {
        authorizationService.requireAdmin(currentUser());
        // If a guardian doesn't exist, deleting should be a straight 404.
        // If it *does* exist but is linked by FK constraints, the delete will fail later
        // (which is the correct signal that it can't be removed yet).
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
}
