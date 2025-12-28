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

    public AttendanceSessionResponse getById(long id) {
        authorizationService.require(currentUser(), Permissions.VIEW_ATTENDANCE);
        AttendanceSession s = attendanceSessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Attendance session not found", "Attendance session not found with id: " + id));
        return toResponse(s);
    }

    public List<AttendanceSessionResponse> listForClassBetween(long classId, LocalDate from, LocalDate to) {
        authorizationService.require(currentUser(), Permissions.VIEW_ATTENDANCE);
        if (from == null || to == null) {
            throw new IllegalArgumentException("from and to are required");
        }

        return attendanceSessionRepository
                .findAllByClazz_IdAndSessionDateBetweenOrderBySessionDateAsc(classId, from, to)
                .stream()
                .map(this::toResponse)
                .toList();
    }

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

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) auth.getPrincipal();
    }
}
