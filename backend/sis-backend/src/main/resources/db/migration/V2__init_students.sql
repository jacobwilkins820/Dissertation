-- V2__init_students.sql
-- Creates the students table and seeds 150 example rows for development/testing.

CREATE TABLE IF NOT EXISTS students (
    id            BIGSERIAL PRIMARY KEY,

    upn           VARCHAR(20)  NOT NULL UNIQUE,  -- state assigned number
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    date_of_birth DATE         NOT NULL,
    gender        VARCHAR(20)  NOT NULL,

    status        VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,

    CONSTRAINT chk_students_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'WITHDRAWN'))
);

-- Helpful index for common search/list operations
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students(last_name);
CREATE INDEX IF NOT EXISTS idx_students_upn       ON students(upn);

-- Seeds 150 students (unique UPNs, varied status/gender/DOB).
-- UPN format: UPN0000000001 ... UPN0000000150 (<= 20 chars)

INSERT INTO students (upn, first_name, last_name, date_of_birth, gender, status, created_at, updated_at)
SELECT
    'UPN' || lpad(gs::text, 10, '0') AS upn,

    -- Rotate through a pool of first names
    (ARRAY[
        'Ava','Noah','Mia','Leo','Ivy','Jack','Amelia','Oliver','Isla','Harry',
        'Freya','George','Grace','Arthur','Lily','Oscar','Sophie','Charlie','Ella','Muhammad'
    ])[((gs - 1) % 20) + 1] AS first_name,

    -- Rotate through a pool of last names
    (ARRAY[
        'Smith','Khan','Patel','Brown','Taylor','Wilson','Johnson','Davies','Evans','Thomas',
        'Roberts','Walker','Wright','Thompson','White','Hughes','Edwards','Green','Hall','Wood'
    ])[((gs - 1) % 20) + 1] AS last_name,

    -- DOB spread across a realistic range (roughly 4–16 years old)
    (DATE '2011-01-01' + ((gs * 23) % 3650))::date AS date_of_birth,

    -- Gender required: cycles through values
    CASE ((gs - 1) % 3)
        WHEN 0 THEN 'MALE'
        WHEN 1 THEN 'FEMALE'
        ELSE 'OTHER'
    END AS gender,

    -- Status cycles: mostly ACTIVE, some INACTIVE, few WITHDRAWN
    CASE ((gs - 1) % 10)
        WHEN 0 THEN 'WITHDRAWN'
        WHEN 1 THEN 'INACTIVE'
        WHEN 2 THEN 'INACTIVE'
        ELSE 'ACTIVE'
    END AS status,

    now() AS created_at,
    now() AS updated_at
FROM generate_series(1, 150) AS gs;
