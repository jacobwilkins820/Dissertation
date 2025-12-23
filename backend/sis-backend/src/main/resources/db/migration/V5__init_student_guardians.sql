-- V5__init_student_guardians.sql
-- Creates student_guardians join table + seeds links.
--
-- Rules:
-- - Every student must have >= 1 guardian link
-- - No student should have > 2 guardian links
-- - relationship is required
-- - Exactly 1 primary guardian per student
-- - Seeding aims for ~1.8 guardians per student (80% have 2, 20% have 1)

CREATE TABLE IF NOT EXISTS student_guardians (
    student_id   BIGINT      NOT NULL,
    guardian_id  BIGINT      NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    is_primary   BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_student_guardians
        PRIMARY KEY (student_id, guardian_id),

    CONSTRAINT fk_student_guardians_student
        FOREIGN KEY (student_id)
        REFERENCES students (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_guardians_guardian
        FOREIGN KEY (guardian_id)
        REFERENCES guardians (id)
        ON DELETE CASCADE,

    CONSTRAINT chk_student_guardians_relationship_not_blank
        CHECK (length(btrim(relationship)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id
    ON student_guardians (student_id);

CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian_id
    ON student_guardians (guardian_id);

-- At most one primary guardian per student
CREATE UNIQUE INDEX IF NOT EXISTS ux_student_guardians_one_primary_per_student
    ON student_guardians (student_id)
    WHERE is_primary = TRUE;


-- Seed links
DO $$
DECLARE
    student_ids    BIGINT[];
    guardian_ids   BIGINT[];
    student_count  INTEGER;
    guardian_count INTEGER;

    i   INTEGER;
    sid BIGINT;
    g1  BIGINT;
    g2  BIGINT;

    give_two BOOLEAN;
BEGIN
    SELECT array_agg(id ORDER BY id) INTO student_ids FROM students;
    SELECT array_agg(id ORDER BY id) INTO guardian_ids FROM guardians;

    student_count  := COALESCE(array_length(student_ids, 1), 0);
    guardian_count := COALESCE(array_length(guardian_ids, 1), 0);

    IF student_count = 0 THEN
        RAISE NOTICE 'V5 seed skipped: no students found.';
        RETURN;
    END IF;

    IF guardian_count = 0 THEN
        RAISE EXCEPTION 'V5 seed failed: no guardians found. V4 may not have run.';
    END IF;

    FOR i IN 1..student_count LOOP
        sid := student_ids[i];

        -- Everyone gets at least one guardian.
        g1 := guardian_ids[((i - 1) % guardian_count) + 1];

        INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary)
        VALUES (sid, g1, 'Mother', TRUE)
        ON CONFLICT (student_id, guardian_id) DO NOTHING;

        -- ~1.8 avg: in each block of 5 students, 4 get a second guardian (80%).
        -- Students 1,6,11,... get only 1 guardian.
        give_two := (guardian_count >= 2) AND ((i % 5) <> 1);

        IF give_two THEN
            -- Pick a second guardian deterministically, and ensure it's different from g1.
            g2 := guardian_ids[((i + 7) % guardian_count) + 1];
            IF g2 = g1 THEN
                g2 := guardian_ids[((i + 13) % guardian_count) + 1];
            END IF;

            INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary)
            VALUES (sid, g2, 'Father', FALSE)
            ON CONFLICT (student_id, guardian_id) DO NOTHING;
        END IF;

        -- Hard enforce "exactly one primary" per student:
        -- 1) clear any other primaries
        UPDATE student_guardians
        SET is_primary = FALSE
        WHERE student_id = sid
          AND guardian_id <> g1
          AND is_primary = TRUE;

        -- 2) ensure g1 is primary
        UPDATE student_guardians
        SET is_primary = TRUE
        WHERE student_id = sid
          AND guardian_id = g1;
    END LOOP;

END $$;