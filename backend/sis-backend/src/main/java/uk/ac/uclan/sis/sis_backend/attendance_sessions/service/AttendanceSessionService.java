package uk.ac.uclan.sis.sis_backend.attendance_sessions.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.academic_years.service.AcademicYearService;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.dto.AttendanceSessionResponse;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.dto.CreateAttendanceSessionRequest;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.entity.AttendanceSession;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.repository.AttendanceSessionRepository;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.classes.repository.ClassRepository;
import uk.ac.uclan.sis.sis_backend.roles.Permissions;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

@Service
public class AttendanceSessionService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AcademicYearService academicYearService;
    private final ClassRepository classRepository;
    private final AuthorizationService authorizationService;

    /**
     * Sets up the attendance session service.
     *
     * @param attendanceSessionRepository repository for sessions
     * @param academicYearService service for academic year lookup
     * @param classRepository repository for class access
     * @param authorizationService service for permission checks
     */
    public AttendanceSessionService(
            AttendanceSessionRepository attendanceSessionRepository,
            AcademicYearService academicYearService,
            ClassRepository classRepository,
            AuthorizationService authorizationService
    ) {
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.academicYearService = academicYearService;
        this.classRepository = classRepository;
        this.authorizationService = authorizationService;
    }

    /**
     * Creates an attendance session.
     *
     * @param request create request body
     * @return created attendance session response
     */
    public AttendanceSessionResponse create(CreateAttendanceSessionRequest request) {
        authorizationService.require(currentUser(), Permissions.EDIT_ATTENDANCE);
        if (request.getClassId() == null || request.getSessionDate() == null || request.getSession() == null) {
            throw new IllegalArgumentException("classId, sessionDate, and session are required");
        }

        Class clazz = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new NotFoundException("Class", "Class not found with id: " + request.getClassId()));

        AcademicYear ay = academicYearService.getForDateOrThrow(request.getSessionDate());

        AttendanceSession session = new AttendanceSession(
                ay,
                clazz,
                request.getSessionDate(),
                request.getSession()
        );

        try {
            AttendanceSession saved = attendanceSessionRepository.save(session);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Attendance session already exists for classId=" + request.getClassId()
                            + ", date=" + request.getSessionDate()
                            + ", session=" + request.getSession()
            );
        }
    }

    /**
     * Gets an attendance session by id.
     *
     * @param id session id
     * @return attendance session response
     */
    public AttendanceSessionResponse getById(long id) {
        authorizationService.require(currentUser(), Permissions.VIEW_STUDENT_DETAILS);
        AttendanceSession s = attendanceSessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Attendance session not found", "Attendance session not found with id: " + id));
        return toResponse(s);
    }

    /**
     * Gets sessions for a class between two dates.
     *
     * @param classId class id
     * @param from start date
     * @param to end date
     * @return list of attendance session responses
     */
    public List<AttendanceSessionResponse> listForClassBetween(long classId, LocalDate from, LocalDate to) {
        authorizationService.require(currentUser(), Permissions.VIEW_STUDENT_DETAILS);
        if (from == null || to == null) {
            throw new IllegalArgumentException("from and to are required");
        }

        return attendanceSessionRepository
                .findAllByClazz_IdAndSessionDateBetweenOrderBySessionDateAsc(classId, from, to)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Turns a session entity into a response.
     *
     * @param s session entity
     * @return attendance session response
     */
    private AttendanceSessionResponse toResponse(AttendanceSession s) {
        return new AttendanceSessionResponse(
                s.getId(),
                s.getClazz().getId(),
                s.getAcademicYear().getId(),
                s.getAcademicYear().getName(),
                s.getSessionDate(),
                s.getSession()
        );
    }

    /**
     * Gets the current logged-in user.
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
