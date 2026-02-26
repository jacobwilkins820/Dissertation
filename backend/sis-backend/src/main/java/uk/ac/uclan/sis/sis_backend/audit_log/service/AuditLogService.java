package uk.ac.uclan.sis.sis_backend.audit_log.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.audit_log.dto.AuditLogResponse;
import uk.ac.uclan.sis.sis_backend.audit_log.entity.AuditLog;
import uk.ac.uclan.sis.sis_backend.audit_log.repository.AuditLogRepository;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuthorizationService authorizationService;

    /**
     * Sets up the audit log service.
     *
     * @param auditLogRepository repository for audit logs
     * @param authorizationService service for permission checks
     */
    public AuditLogService(
            AuditLogRepository auditLogRepository,
            AuthorizationService authorizationService
    ) {
        this.auditLogRepository = auditLogRepository;
        this.authorizationService = authorizationService;
    }

    /**
     * Writes an audit log entry.
     *
     * @param actorUserId actor user id
     * @param action action name
     * @param entityType entity type
     * @param entityId entity id
     * @param details details payload
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long actorUserId, String action, String entityType, Long entityId, String details) {
        User user = currentUser();
        Long effectiveActorUserId = resolveActorUserId(actorUserId, user);
        if (action == null || action.isBlank()) throw new IllegalArgumentException("action is required");
        if (entityType == null || entityType.isBlank()) throw new IllegalArgumentException("entityType is required");
        if (entityId == null) throw new IllegalArgumentException("entityId is required");

        AuditLog entry = new AuditLog(
                effectiveActorUserId,
                action.trim(),
                entityType.trim().toUpperCase(),
                entityId,
                details
        );
        auditLogRepository.save(entry);
    }

    /**
     * Gets all audit logs.
     *
     * @param pageable paging request
     * @return page of audit log responses
     */
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAll(Pageable pageable) {
        authorizationService.requireAdmin(currentUser());
        return auditLogRepository.findAll(pageable).map(this::toResponse);
    }

    /**
     * Gets audit logs by actor user id.
     *
     * @param actorUserId actor user id
     * @param pageable paging request
     * @return page of audit log responses
     */
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getByActorUserId(Long actorUserId, Pageable pageable) {
        authorizationService.requireAdmin(currentUser());
        return auditLogRepository.findByActorUserId(actorUserId, pageable).map(this::toResponse);
    }

    /**
     * Gets audit logs by entity.
     *
     * @param entityType entity type
     * @param entityId entity id
     * @param pageable paging request
     * @return page of audit log responses
     */
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getByEntity(String entityType, Long entityId, Pageable pageable) {
        authorizationService.requireAdmin(currentUser());
        return auditLogRepository.findByEntityTypeIgnoreCaseAndEntityId(entityType, entityId, pageable).map(this::toResponse);
    }

    /**
     * Turns an audit log entity into a response.
     *
     * @param e audit log entity
     * @return audit log response
     */
    private AuditLogResponse toResponse(AuditLog e) {
        return new AuditLogResponse(
                e.getId(),
                e.getActorUserId(),
                e.getAction(),
                e.getEntityType(),
                e.getEntityId(),
                e.getTimestamp(),
                e.getDetails()
        );
    }

    /**
     * Gets the current logged-in user.
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
     * Checks the actor id for an audit entry.
     * Non-admin users can only log as themselves.
     */
    private Long resolveActorUserId(Long requestedActorUserId, User user) {
        if (requestedActorUserId == null) return user.getId();

        String roleName = user.getRole() == null ? null : user.getRole().getName();
        boolean isAdmin = roleName != null && roleName.equalsIgnoreCase("ADMIN");
        if (isAdmin) return requestedActorUserId;

        if (!requestedActorUserId.equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot set actor_user_id for another user");
        }
        return requestedActorUserId;
    }
}
