package uk.ac.uclan.sis.sis_backend.attendance_sessions.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import uk.ac.uclan.sis.sis_backend.attendance_sessions.dto.AttendanceSessionResponse;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.dto.CreateAttendanceSessionRequest;
import uk.ac.uclan.sis.sis_backend.attendance_sessions.service.AttendanceSessionService;

@RestController
@RequestMapping("/api/attendance-sessions")
public class AttendanceSessionController {

    private final AttendanceSessionService attendanceSessionService;

    /**
     * Sets up the attendance session controller.
     *
     * @param attendanceSessionService service for attendance sessions
     */
    public AttendanceSessionController(AttendanceSessionService attendanceSessionService) {
        this.attendanceSessionService = attendanceSessionService;
    }

    /**
     * Creates an attendance session.
     *
     * @param request create request body
     * @return created attendance session response
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AttendanceSessionResponse create(@RequestBody CreateAttendanceSessionRequest request) {
        return attendanceSessionService.create(request);
    }

    /**
     * Gets an attendance session by id.
     *
     * @param id session id
     * @return attendance session response
     */
    @GetMapping("/{id}")
    public AttendanceSessionResponse getById(@PathVariable long id) {
        return attendanceSessionService.getById(id);
    }

    /**
     * Gets sessions for a class between two dates.
     *
     * @param classId class id
     * @param from start date
     * @param to end date
     * @return list of attendance session responses
     */
    @GetMapping
    public List<AttendanceSessionResponse> listForClassBetween(
            @RequestParam long classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return attendanceSessionService.listForClassBetween(classId, from, to);
    }
}
