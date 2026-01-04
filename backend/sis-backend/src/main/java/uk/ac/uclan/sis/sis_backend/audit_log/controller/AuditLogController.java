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

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public Page<AuditLogResponse> getAll(Pageable pageable) {
        return auditLogService.getAll(pageable);
    }

    @GetMapping("/actor/{actorUserId}")
    public Page<AuditLogResponse> getByActor(@PathVariable Long actorUserId, Pageable pageable) {
        return auditLogService.getByActorUserId(actorUserId, pageable);
    }

    @GetMapping("/entity")
    public Page<AuditLogResponse> getByEntity(
            @RequestParam String entityType,
            @RequestParam Long entityId,
            Pageable pageable
    ) {
        return auditLogService.getByEntity(entityType, entityId, pageable);
    }

    // Post for testing / internal use
    @PostMapping
    public void create(@Valid @RequestBody CreateAuditLogRequest req) {
        auditLogService.log(req.getActorUserId(), req.getAction(), req.getEntityType(), req.getEntityId(), req.getDetails());
    }
}
