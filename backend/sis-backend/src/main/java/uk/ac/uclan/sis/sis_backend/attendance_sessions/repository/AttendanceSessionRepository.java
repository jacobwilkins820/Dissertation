package uk.ac.uclan.sis.sis_backend.attendance_sessions.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.enums.SessionPart;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {

    /**
     * Finds a session by class, date, and part.
     *
     * @param classId class id
     * @param sessionDate session date
     * @param session session part
     * @return matching session, when present
     */
    Optional<AttendanceSession> findByClazz_IdAndSessionDateAndSession(
            Long classId,
            LocalDate sessionDate,
            SessionPart session
    );

    /**
     * Returns sessions for a class between two dates ordered by date.
     *
     * @param classId class id
     * @param from start date
     * @param to end date
     * @return list of attendance sessions
     */
    List<AttendanceSession> findAllByClazz_IdAndSessionDateBetweenOrderBySessionDateAsc(
            Long classId,
            LocalDate from,
            LocalDate to
    );
}
