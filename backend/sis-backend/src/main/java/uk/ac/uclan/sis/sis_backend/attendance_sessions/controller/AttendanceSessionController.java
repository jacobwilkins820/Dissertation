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

    public AttendanceSessionController(AttendanceSessionService attendanceSessionService) {
        this.attendanceSessionService = attendanceSessionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AttendanceSessionResponse create(@RequestBody CreateAttendanceSessionRequest request) {
        return attendanceSessionService.create(request);
    }

    @GetMapping("/{id}")
    public AttendanceSessionResponse getById(@PathVariable long id) {
        return attendanceSessionService.getById(id);
    }

    @GetMapping
    public List<AttendanceSessionResponse> listForClassBetween(
            @RequestParam long classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return attendanceSessionService.listForClassBetween(classId, from, to);
    }
}
