package uk.ac.uclan.sis.sis_backend.audit_log.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.uclan.sis.sis_backend.audit_log.dto.AuditLogResponse;
import uk.ac.uclan.sis.sis_backend.audit_log.entity.AuditLog;
import uk.ac.uclan.sis.sis_backend.audit_log.repository.AuditLogRepository;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Main method I call from anywhere.
     * actorUserId can be null (system action).
     */

    //TODO: delete this comment block
    /**example use for future reference inside a service file: 
     * 
     * 
     * // inject it
     *   private final AuditLogService auditLogService;
     *
     *   public StudentService(..., AuditLogService auditLogService) {
     *      ...
     *     this.auditLogService = auditLogService;
     * }
     *
     *   // call it wherever it matters
     *   auditLogService.log(
     *       actorUserId,                 // Long (nullable)
     *       "STUDENT_CREATED",           // action
     *       "STUDENT",                   // entityType
     *       createdStudent.getId(),      // entityId
     *       "Created student via API"    // details (nullable)
     *   );
     *
     */

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long actorUserId, String action, String entityType, Long entityId, String details) {
        if (action == null || action.isBlank()) throw new IllegalArgumentException("action is required");
        if (entityType == null || entityType.isBlank()) throw new IllegalArgumentException("entityType is required");
        if (entityId == null) throw new IllegalArgumentException("entityId is required");

        AuditLog entry = new AuditLog(actorUserId, action.trim(), entityType.trim().toUpperCase(), entityId, details);
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAll(Pageable pageable) {
        return auditLogRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getByActorUserId(Long actorUserId, Pageable pageable) {
        return auditLogRepository.findByActorUserId(actorUserId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getByEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeIgnoreCaseAndEntityId(entityType, entityId, pageable).map(this::toResponse);
    }

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
}
