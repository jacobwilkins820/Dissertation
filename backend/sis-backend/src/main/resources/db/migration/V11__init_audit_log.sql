-- V12__init_audit_log.sql
-- Creates audit_log table and seeds a few example rows.

CREATE TABLE IF NOT EXISTS audit_log (
    id             BIGSERIAL PRIMARY KEY,
    actor_user_id  BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,

    action         VARCHAR(100) NOT NULL,
    entity_type    VARCHAR(50)  NOT NULL,
    entity_id      BIGINT       NOT NULL,

    "timestamp"    TIMESTAMP    NOT NULL DEFAULT NOW(),
    details        TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log("timestamp");

-- Seed data (safe even if there are no users yet)
INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, "timestamp", details)
SELECT u.id, 'SYSTEM_SEED', 'SYSTEM', 0, NOW(), 'Initial audit_log seed row (system)'
FROM users u
ORDER BY u.id
LIMIT 1;

INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, "timestamp", details)
VALUES
(NULL, 'SYSTEM_STARTUP', 'SYSTEM', 1, NOW(), 'Audit logging enabled');
