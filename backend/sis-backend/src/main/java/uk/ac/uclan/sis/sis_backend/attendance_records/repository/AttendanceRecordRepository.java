package uk.ac.uclan.sis.sis_backend.attendance_records.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uk.ac.uclan.sis.sis_backend.attendance_records.entity.AttendanceRecord;

import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByAttendanceSession_IdOrderByIdAsc(Long attendanceSessionId);

    Optional<AttendanceRecord> findByAttendanceSession_IdAndStudent_Id(Long attendanceSessionId, Long studentId);

    boolean existsByAttendanceSession_IdAndStudent_Id(Long attendanceSessionId, Long studentId);
}
