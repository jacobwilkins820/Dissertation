package uk.ac.uclan.sis.sis_backend.attendance_records.service;

import jakarta.persistence.EntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.attendance_records.dto.*;
import uk.ac.uclan.sis.sis_backend.attendance_records.entity.AttendanceRecord;
import uk.ac.uclan.sis.sis_backend.attendance_records.repository.AttendanceRecordRepository;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceRecordService {

    private final AttendanceRecordRepository repository;
    private final EntityManager em;
    private final AuthorizationService authorizationService;

    /**
     * Creates the attendance record service.
     *
     * @param repository repository for attendance records
     * @param em entity manager for references
     * @param authorizationService service for permission checks
     */
    public AttendanceRecordService(
            AttendanceRecordRepository repository,
            EntityManager em,
            AuthorizationService authorizationService
    ) {
        this.repository = repository;
        this.em = em;
        this.authorizationService = authorizationService;
    }

    /**
     * Returns an attendance record by id.
     *
     * @param id record id
     * @return attendance record response
     */
    @Transactional(readOnly = true)
    public AttendanceRecordResponse getById(Long id) {
        authorizationService.require(currentUser(), Permissions.VIEW_ATTENDANCE);
        AttendanceRecord r = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Attendance record", "Attendance record not found: " + id));
        return toResponse(r);
    }

    /**
     * Returns records for a session.
     *
     * @param attendanceSessionId session id
     * @return list of attendance record list items
     */
    @Transactional(readOnly = true)
    public List<AttendanceRecordListItemResponse> listBySession(Long attendanceSessionId) {
        authorizationService.require(currentUser(), Permissions.VIEW_ATTENDANCE);
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

    /**
     * Creates an attendance record.
     *
     * @param req create request payload
     * @return created attendance record response
     */
    @Transactional
    public AttendanceRecordResponse create(CreateAttendanceRecordRequest req) {
        authorizationService.require(currentUser(), Permissions.EDIT_ATTENDANCE);
        User user = currentUser();
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
        r.setMarkedByUser(user);
        r.setMarkedAt(LocalDateTime.now());

        try {
            AttendanceRecord saved = repository.save(r);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Invalid attendanceSessionId/studentId, or duplicate record.", ex);
        }
    }

    /**
     * Updates an attendance record.
     *
     * @param id record id
     * @param req update request payload
     * @return updated attendance record response
     */
    @Transactional
    public AttendanceRecordResponse update(Long id, UpdateAttendanceRecordRequest req) {
        authorizationService.require(currentUser(), Permissions.EDIT_ATTENDANCE);
        User user = currentUser();
        AttendanceRecord r = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Attendance record", "Attendance record not found: " + id));

        r.setStatus(req.getStatus());
        r.setReason(req.getReason());
        r.setMarkedByUser(user);
        r.setMarkedAt(LocalDateTime.now());

        AttendanceRecord saved = repository.save(r);
        return toResponse(saved);
    }

    /**
     * Deletes an attendance record by id.
     *
     * @param id record id
     */
    @Transactional
    public void delete(Long id) {
        authorizationService.require(currentUser(), Permissions.EDIT_ATTENDANCE);
        if (!repository.existsById(id)) {
            throw new NotFoundException("Attendance record", "Attendance record not found: " + id);
        }
        repository.deleteById(id);
    }

    /**
     * Maps an attendance record entity to a response.
     *
     * @param r attendance record entity
     * @return attendance record response
     */
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

    /**
     * Returns the current authenticated user.
     *
     * @return current user principal
     */
    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }
}
