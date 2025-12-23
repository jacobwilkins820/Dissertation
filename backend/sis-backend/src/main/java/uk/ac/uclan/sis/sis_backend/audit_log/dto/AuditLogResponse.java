package uk.ac.uclan.sis.sis_backend.audit_log.dto;

import java.time.Instant;

public class AuditLogResponse {
    private Long id;
    private Long actorUserId;
    private String action;
    private String entityType;
    private Long entityId;
    private Instant timestamp;
    private String details;

    public AuditLogResponse() {}

    public AuditLogResponse(Long id, Long actorUserId, String action, String entityType, Long entityId, Instant timestamp, String details) {
        this.id = id;
        this.actorUserId = actorUserId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.timestamp = timestamp;
        this.details = details;
    }

    public Long getId() { return id; }
    public Long getActorUserId() { return actorUserId; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public Instant getTimestamp() { return timestamp; }
    public String getDetails() { return details; }
}
