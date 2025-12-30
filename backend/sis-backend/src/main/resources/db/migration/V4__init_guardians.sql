-- V4__init_guardians.sql
-- Creates guardians table (if missing), seeds baseline guardians, then:
-- 1) Adds FK users.linked_guardian_id -> guardians.id (if not already present)
-- 2) Links every GUARDIAN user to a guardian row (so all parents have a linked guardian)

CREATE TABLE IF NOT EXISTS guardians (
    id              BIGSERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(50),

    address_line_1  VARCHAR(255),
    address_line_2  VARCHAR(255),
    city            VARCHAR(120),
    postcode        VARCHAR(20),

    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardians_email ON guardians(email);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);

-- Seed baseline guardians only if empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM guardians) THEN
        INSERT INTO guardians (
            first_name, last_name, email, phone,
            address_line_1, address_line_2, city, postcode,
            created_at, updated_at
        )
        SELECT
            (ARRAY[
                'Alex','Jamie','Taylor','Jordan','Casey','Morgan','Riley','Sam','Cameron','Avery',
                'Drew','Parker','Rowan','Quinn','Reese','Hayden','Skyler','Robin','Kris','Bailey'
            ])[((gs - 1) % 20) + 1],

            (ARRAY[
                'Smith','Jones','Taylor','Brown','Williams','Wilson','Johnson','Davies','Patel','Wright',
                'Walker','White','Roberts','Green','Hall','Thomas','Clarke','Jackson','Wood','Thompson'
            ])[((gs - 1) % 20) + 1],

            LOWER('guardian' || gs || '@example.com'),
            '07' || LPAD(((gs * 7919) % 100000000)::TEXT, 9, '0'),

            (gs || ' High Street'),
            NULL,
            (ARRAY['Preston','Lancaster','Manchester','Liverpool','Leeds'])[((gs - 1) % 5) + 1],
            'PR' || LPAD(((gs * 37) % 100)::TEXT, 2, '0') || ' ' || (ARRAY['AA','AB','AD','AE'])[((gs - 1) % 4) + 1],

            NOW(),
            NOW()
        FROM generate_series(1, 20) AS gs;
    END IF;
END $$;

-- Add FK users.linked_guardian_id -> guardians.id (only if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'users'
          AND tc.constraint_name = 'fk_users_linked_guardian'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT fk_users_linked_guardian
            FOREIGN KEY (linked_guardian_id)
            REFERENCES guardians(id)
            ON DELETE SET NULL
            ON UPDATE RESTRICT;
    END IF;
END $$;

-- Link every GUARDIAN user to a guardian row (so all parents have a linked guardian)
-- Assumes roles.name = 'GUARDIAN' for guardian-users.
WITH guardian_users AS (
    SELECT
        u.id AS user_id,
        ROW_NUMBER() OVER (ORDER BY u.id) AS rn
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'PARENT'
      AND u.linked_guardian_id IS NULL
),
available_guardians AS (
    SELECT
        g.id AS guardian_id,
        ROW_NUMBER() OVER (ORDER BY g.id) AS rn
    FROM guardians g
),
pairs AS (
    SELECT gu.user_id, ag.guardian_id
    FROM guardian_users gu
    JOIN available_guardians ag ON ag.rn = gu.rn
)
UPDATE users u
SET linked_guardian_id = p.guardian_id,
    updated_at = NOW()
FROM pairs p
WHERE u.id = p.user_id;
