package uk.ac.uclan.sis.sis_backend.attendance_sessions.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.enums.SessionPart;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {

    Optional<AttendanceSession> findByClazz_IdAndSessionDateAndSession(
            Long classId,
            LocalDate sessionDate,
            SessionPart session
    );

    List<AttendanceSession> findAllByClazz_IdAndSessionDateBetweenOrderBySessionDateAsc(
            Long classId,
            LocalDate from,
            LocalDate to
    );
}
