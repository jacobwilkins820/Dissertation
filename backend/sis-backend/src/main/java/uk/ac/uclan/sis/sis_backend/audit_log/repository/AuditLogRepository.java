package uk.ac.uclan.sis.sis_backend.audit_log.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import uk.ac.uclan.sis.sis_backend.audit_log.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByActorUserId(Long actorUserId, Pageable pageable);

    Page<AuditLog> findByEntityTypeIgnoreCaseAndEntityId(String entityType, Long entityId, Pageable pageable);

    Page<AuditLog> findByEntityTypeIgnoreCase(String entityType, Pageable pageable);
}
