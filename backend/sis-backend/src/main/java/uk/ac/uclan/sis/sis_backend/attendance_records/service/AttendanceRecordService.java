package uk.ac.uclan.sis.sis_backend.attendance_records.service;

import jakarta.persistence.EntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.uclan.sis.sis_backend.attendance_records.dto.*;
import uk.ac.uclan.sis.sis_backend.attendance_records.entity.AttendanceRecord;
import uk.ac.uclan.sis.sis_backend.attendance_records.repository.AttendanceRecordRepository;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceRecordService {

    private final AttendanceRecordRepository repository;
    private final EntityManager em;

    public AttendanceRecordService(AttendanceRecordRepository repository, EntityManager em) {
        this.repository = repository;
        this.em = em;
    }

    @Transactional(readOnly = true)
    public AttendanceRecordResponse getById(Long id) {
        AttendanceRecord r = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Attendance record", "Attendance record not found: " + id));
        return toResponse(r);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordListItemResponse> listBySession(Long attendanceSessionId) {
        return repository.findByAttendanceSession_IdOrderByIdAsc(attendanceSessionId)
                .stream()
                .map(r -> new AttendanceRecordListItemResponse(
                        r.getId(),
                        r.getStudent().getId(),
                        r.getStatus(),
                        r.getMarkedAt()
                ))
                .toList();
    }

    @Transactional
    public AttendanceRecordResponse create(CreateAttendanceRecordRequest req) {
        if (repository.existsByAttendanceSession_IdAndStudent_Id(req.getAttendanceSessionId(), req.getStudentId())) {
            throw new IllegalArgumentException("Attendance record already exists for this session + student.");
        }

        AttendanceSession sessionRef = em.getReference(AttendanceSession.class, req.getAttendanceSessionId());
        Student studentRef = em.getReference(Student.class, req.getStudentId());

        AttendanceRecord r = new AttendanceRecord();
        r.setAttendanceSession(sessionRef);
        r.setStudent(studentRef);
        r.setStatus(req.getStatus());
        r.setReason(req.getReason());

        //TODO: Set markedByUser when authentication is implemented
        r.setMarkedAt(LocalDateTime.now());

        try {
            AttendanceRecord saved = repository.save(r);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Invalid attendanceSessionId/studentId, or duplicate record.", ex);
        }
    }

    @Transactional
    public AttendanceRecordResponse update(Long id, UpdateAttendanceRecordRequest req) {
        AttendanceRecord r = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Attendance record", "Attendance record not found: " + id));

        r.setStatus(req.getStatus());
        r.setReason(req.getReason());
        r.setMarkedAt(LocalDateTime.now());

        AttendanceRecord saved = repository.save(r);
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Attendance record", "Attendance record not found: " + id);
        }
        repository.deleteById(id);
    }

    private AttendanceRecordResponse toResponse(AttendanceRecord r) {
        Long markedById = (r.getMarkedByUser() == null) ? null : r.getMarkedByUser().getId();
        return new AttendanceRecordResponse(
                r.getId(),
                r.getAttendanceSession().getId(),
                r.getStudent().getId(),
                markedById,
                r.getStatus(),
                r.getReason(),
                r.getMarkedAt(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
