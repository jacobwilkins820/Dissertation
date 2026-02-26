package uk.ac.uclan.sis.sis_backend.audit_log.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(columnDefinition = "TEXT")
    private String details;

    /**
     * sets up the timestamp on insert when missing.
     */
    @PrePersist
    void prePersist() {
        if (timestamp == null) timestamp = Instant.now();
    }

    /**
     * Creates an audit log entity for JPA.
     */
    public AuditLog() {}

    /**
     * Creates an audit log entity.
     *
     * @param actorUserId actor user id
     * @param action action name
     * @param entityType entity type
     * @param entityId entity id
     * @param details details payload
     */
    public AuditLog(Long actorUserId, String action, String entityType, Long entityId, String details) {
        this.actorUserId = actorUserId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
    }

    /**
     * Gets the audit log id.
     *
     * @return audit log id
     */
    public Long getId() {
        return id;
    }

    /**
     * Gets the actor user id.
     *
     * @return actor user id
     */
    public Long getActorUserId() {
        return actorUserId;
    }

    /**
     * Sets the actor user id.
     *
     * @param actorUserId actor user id
     */
    public void setActorUserId(Long actorUserId) {
        this.actorUserId = actorUserId;
    }

    /**
     * Gets the action name.
     *
     * @return action name
     */
    public String getAction() {
        return action;
    }

    /**
     * Sets the action name.
     *
     * @param action action name
     */
    public void setAction(String action) {
        this.action = action;
    }

    /**
     * Gets the entity type.
     *
     * @return entity type
     */
    public String getEntityType() {
        return entityType;
    }

    /**
     * Sets the entity type.
     *
     * @param entityType entity type
     */
    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    /**
     * Gets the entity id.
     *
     * @return entity id
     */
    public Long getEntityId() {
        return entityId;
    }

    /**
     * Sets the entity id.
     *
     * @param entityId entity id
     */
    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    /**
     * Gets the timestamp.
     *
     * @return timestamp
     */
    public Instant getTimestamp() {
        return timestamp;
    }

    /**
     * Sets the timestamp.
     *
     * @param timestamp timestamp
     */
    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    /**
     * Gets the details payload.
     *
     * @return details payload
     */
    public String getDetails() {
        return details;
    }

    /**
     * Sets the details payload.
     *
     * @param details details payload
     */
    public void setDetails(String details) {
        this.details = details;
    }
}
