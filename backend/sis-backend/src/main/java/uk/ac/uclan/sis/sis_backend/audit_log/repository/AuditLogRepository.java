package uk.ac.uclan.sis.sis_backend.audit_log.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import uk.ac.uclan.sis.sis_backend.audit_log.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Gets audit logs by actor user id.
     *
     * @param actorUserId actor user id
     * @param pageable paging request
     * @return page of audit logs
     */
    Page<AuditLog> findByActorUserId(Long actorUserId, Pageable pageable);

    /**
     * Gets audit logs by entity type and id.
     *
     * @param entityType entity type
     * @param entityId entity id
     * @param pageable paging request
     * @return page of audit logs
     */
    Page<AuditLog> findByEntityTypeIgnoreCaseAndEntityId(String entityType, Long entityId, Pageable pageable);

    /**
     * Gets audit logs by entity type.
     *
     * @param entityType entity type
     * @param pageable paging request
     * @return page of audit logs
     */
    Page<AuditLog> findByEntityTypeIgnoreCase(String entityType, Pageable pageable);
}
