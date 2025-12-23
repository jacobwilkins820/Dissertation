-- V4__init_guardians.sql
-- Creates guardians table (if missing) and seeds it with enough rows
-- to support ~1.8 guardians per student on average.

-- 1) Create table if it doesn't exist yet.
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

-- 2) Seed rows.
DO $$
DECLARE
    student_count     INTEGER;
    target_guardians  INTEGER;
BEGIN
    SELECT COUNT(*) INTO student_count FROM students;

    IF student_count = 0 THEN
        target_guardians := 10;
    ELSE
        target_guardians := CEIL(student_count * 1.8)::INT;
    END IF;

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

        -- Simple fake address data (kept short and predictable)
        (gs || ' High Street'),
        NULL,
        (ARRAY['Preston','Lancaster','Manchester','Liverpool','Leeds'])[((gs - 1) % 5) + 1],
        'PR' || LPAD(((gs * 37) % 100)::TEXT, 2, '0') || ' ' || (ARRAY['AA','AB','AD','AE'])[((gs - 1) % 4) + 1],

        NOW(),
        NOW()
    FROM generate_series(1, target_guardians) AS gs;

END $$;
