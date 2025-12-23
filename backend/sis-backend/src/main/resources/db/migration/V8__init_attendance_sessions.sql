-- V8__init_attendance_sessions.sql
-- Creates attendance_sessions and seeds a small safe baseline if possible.

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id               BIGSERIAL PRIMARY KEY,
    academic_year_id BIGINT NOT NULL REFERENCES academic_years(id),
    class_id         BIGINT NOT NULL REFERENCES classes(id),

    session_date     DATE NOT NULL,
    session          VARCHAR(10) NOT NULL, -- AM / PM

    CONSTRAINT chk_attendance_sessions_session
        CHECK (session IN ('AM', 'PM')),

    CONSTRAINT uq_attendance_sessions_unique
        UNIQUE (class_id, session_date, session)
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_id
    ON attendance_sessions(class_id);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_academic_year_id
    ON attendance_sessions(academic_year_id);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_session_date
    ON attendance_sessions(session_date);

-- Seed data
-- If there's at least one class and at least one academic year covering TODAY, create AM+PM sessions for that class today.
DO $$
DECLARE
    v_class_ids BIGINT[];
    v_ay_id     BIGINT;
    v_date      DATE;
    v_class_id  BIGINT;
BEGIN
    -- Collect up to 3 class IDs
    SELECT ARRAY(
        SELECT id
        FROM classes
        ORDER BY id
        LIMIT 3
    )
    INTO v_class_ids;

    -- Resolve academic year for today
    SELECT id
    INTO v_ay_id
    FROM academic_years
    WHERE CURRENT_DATE BETWEEN starts_on AND ends_on
    ORDER BY starts_on DESC
    LIMIT 1;

    -- Bail safely if prerequisites aren't met
    IF v_class_ids IS NULL OR array_length(v_class_ids, 1) IS NULL OR v_ay_id IS NULL THEN
        RETURN;
    END IF;

    -- Generate sessions for the last 14 days
    FOR v_date IN
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '13 days',
            CURRENT_DATE,
            INTERVAL '1 day'
        )::DATE
    LOOP
        FOREACH v_class_id IN ARRAY v_class_ids
        LOOP
            INSERT INTO attendance_sessions (
                academic_year_id,
                class_id,
                session_date,
                session
            )
            VALUES
                (v_ay_id, v_class_id, v_date, 'AM'),
                (v_ay_id, v_class_id, v_date, 'PM')
            ON CONFLICT (class_id, session_date, session) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
