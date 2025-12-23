-- V10__init_attendance_records.sql
-- Creates attendance_records table and seeds initial data
-- Stores a student's attendance status for a given attendance session.

-- 1) Create table
CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,

    attendance_session_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    marked_by_user_id BIGINT,

    status VARCHAR(20) NOT NULL, -- PRESENT / ABSENT / LATE
    status_reason VARCHAR(255),  -- reason for ABSENT or LATE

    marked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attendance_records_session
        FOREIGN KEY (attendance_session_id)
        REFERENCES attendance_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_records_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_records_marked_by
        FOREIGN KEY (marked_by_user_id)
        REFERENCES users(id),

    CONSTRAINT uk_attendance_session_student
        UNIQUE (attendance_session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session
    ON attendance_records(attendance_session_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student
    ON attendance_records(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_status
    ON attendance_records(status);

-- 2) Seed data
-- For every attendance session, create a PRESENT record
-- for every enrolled student if no record already exists.

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT
            s.id  AS student_id,
            ses.id AS session_id
        FROM attendance_sessions ses
        JOIN enrolments e
            ON e.class_id = ses.class_id
        JOIN students s
            ON s.id = e.student_id
        WHERE NOT EXISTS (
            SELECT 1
            FROM attendance_records ar
            WHERE ar.attendance_session_id = ses.id
              AND ar.student_id = s.id
        )
    LOOP
        INSERT INTO attendance_records (
            attendance_session_id,
            student_id,
            status,
            created_at,
            updated_at
        )
        VALUES (
            rec.session_id,
            rec.student_id,
            'PRESENT',
            NOW(),
            NOW()
        );
    END LOOP;
END $$;
