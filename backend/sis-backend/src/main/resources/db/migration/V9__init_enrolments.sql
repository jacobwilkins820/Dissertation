-- V9__init_enrolments.sql
-- Creates enrolments table and seeds sensible starter enrolments.
-- Enrolments link a student to a class in a specific academic year, with validity dates.

-- 1) Create table
CREATE TABLE IF NOT EXISTS enrolments (
    id BIGSERIAL PRIMARY KEY,

    student_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_enrolments_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enrolments_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enrolments_academic_year
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_enrolments_student_class_year
        UNIQUE (student_id, class_id, academic_year_id),

    CONSTRAINT ck_enrolments_end_date_after_start_date
        CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_enrolments_student_id
    ON enrolments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrolments_class_id
    ON enrolments(class_id);

CREATE INDEX IF NOT EXISTS idx_enrolments_academic_year_id
    ON enrolments(academic_year_id);

-- 2) Seed data
-- Rule: For each student, create one enrolment in the most recent academic year.
-- start_date = academic_year.starts_on, end_date = NULL.

DO $$
DECLARE
    ay_id BIGINT;
    ay_start DATE;
BEGIN
    -- Pick the most recent academic year (latest starts_on)
    SELECT id, starts_on
      INTO ay_id, ay_start
      FROM academic_years
      ORDER BY starts_on DESC
      LIMIT 1;

    -- If there is no academic year or no classes or no students, do nothing.
    IF ay_id IS NULL THEN
        RETURN;
    END IF;

    -- Insert enrolments for students not already enrolled in that academic year.
    -- Assign a class per student by ordering classes and using modulo arithmetic.
    INSERT INTO enrolments (student_id, class_id, academic_year_id, start_date, end_date, created_at, updated_at)
    SELECT
        s.id AS student_id,
        c.id AS class_id,
        ay_id AS academic_year_id,
        ay_start AS start_date,
        NULL::DATE AS end_date,
        NOW(),
        NOW()
    FROM students s
    JOIN LATERAL (
        SELECT id
        FROM classes
        ORDER BY id
        OFFSET ( (s.id - 1) % GREATEST((SELECT COUNT(*) FROM classes), 1) )
        LIMIT 1
    ) c ON TRUE
    WHERE NOT EXISTS (
        SELECT 1
        FROM enrolments e
        WHERE e.student_id = s.id
          AND e.academic_year_id = ay_id
    );
END $$;