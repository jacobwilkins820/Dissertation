package uk.ac.uclan.sis.sis_backend.attendance_records.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uk.ac.uclan.sis.sis_backend.attendance_records.entity.AttendanceRecord;

import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    /**
     * Returns records for a session ordered by id.
     *
     * @param attendanceSessionId session id
     * @return list of attendance records
     */
    List<AttendanceRecord> findByAttendanceSession_IdOrderByIdAsc(Long attendanceSessionId);

    /**
     * Finds a record by session and student.
     *
     * @param attendanceSessionId session id
     * @param studentId student id
     * @return matching record, when present
     */
    Optional<AttendanceRecord> findByAttendanceSession_IdAndStudent_Id(Long attendanceSessionId, Long studentId);

    /**
     * Returns true when a record exists for a session and student.
     *
     * @param attendanceSessionId session id
     * @param studentId student id
     * @return true when record exists
     */
    boolean existsByAttendanceSession_IdAndStudent_Id(Long attendanceSessionId, Long studentId);
}
