-- V2__init_users.sql
-- Creates the users table and seeds 10 users per role.
-- Password for all users: Password123!

-- 1) Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,

    role_id BIGINT NOT NULL,

    first_name VARCHAR(255) NOT NULL,
    last_name  VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2) Seed users
-- Ensure pgcrypto exists for crypt()/gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert 10 users per role only if that role currently has no users.
-- Names are human-readable; emails remain globally unique.
WITH roles_to_seed AS (
    SELECT r.id, r.name
    FROM roles r
    WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.role_id = r.id
    )
)
INSERT INTO users (
    role_id,
    first_name,
    last_name,
    email,
    password_hash,
    enabled,
    created_at,
    updated_at
)
SELECT
    r.id AS role_id,

    -- dev note: simple generated names; not unique by design
    'User' || gs.i AS first_name,
    INITCAP(REGEXP_REPLACE(r.name, '_', ' ', 'g')) AS last_name,

    -- dev note: email must be unique globally
    LOWER(REGEXP_REPLACE(r.name, '\s+', '_', 'g')) || '_' || gs.i || '@example.local' AS email,

    crypt('Password123!', gen_salt('bf', 10)) AS password_hash,
    TRUE AS enabled,
    NOW() AS created_at,
    NOW() AS updated_at
FROM roles_to_seed r
CROSS JOIN LATERAL generate_series(1, 10) AS gs(i);
