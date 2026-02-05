package uk.ac.uclan.sis.sis_backend.audit_log.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import uk.ac.uclan.sis.sis_backend.audit_log.dto.AuditLogResponse;
import uk.ac.uclan.sis.sis_backend.audit_log.dto.CreateAuditLogRequest;
import uk.ac.uclan.sis.sis_backend.audit_log.service.AuditLogService;

@RestController
@RequestMapping("/api/audit-log")
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Creates the audit log controller.
     *
     * @param auditLogService service for audit logs
     */
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Returns all audit logs.
     *
     * @param pageable paging request
     * @return page of audit log responses
     */
    @GetMapping
    public Page<AuditLogResponse> getAll(Pageable pageable) {
        return auditLogService.getAll(pageable);
    }

    /**
     * Returns audit logs by actor user id.
     *
     * @param actorUserId actor user id
     * @param pageable paging request
     * @return page of audit log responses
     */
    @GetMapping("/actor/{actorUserId}")
    public Page<AuditLogResponse> getByActor(@PathVariable Long actorUserId, Pageable pageable) {
        return auditLogService.getByActorUserId(actorUserId, pageable);
    }

    /**
     * Returns audit logs by entity type and id.
     *
     * @param entityType entity type
     * @param entityId entity id
     * @param pageable paging request
     * @return page of audit log responses
     */
    @GetMapping("/entity")
    public Page<AuditLogResponse> getByEntity(
            @RequestParam String entityType,
            @RequestParam Long entityId,
            Pageable pageable
    ) {
        return auditLogService.getByEntity(entityType, entityId, pageable);
    }

    /**
     * Creates an audit log entry (internal/testing).
     *
     * @param req create request payload
     */
    @PostMapping
    public void create(@Valid @RequestBody CreateAuditLogRequest req) {
        auditLogService.log(req.getActorUserId(), req.getAction(), req.getEntityType(), req.getEntityId(), req.getDetails());
    }
}
