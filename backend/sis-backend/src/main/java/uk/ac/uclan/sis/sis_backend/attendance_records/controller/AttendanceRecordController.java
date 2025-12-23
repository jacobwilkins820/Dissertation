package uk.ac.uclan.sis.sis_backend.attendance_records.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import uk.ac.uclan.sis.sis_backend.attendance_records.dto.*;
import uk.ac.uclan.sis.sis_backend.attendance_records.service.AttendanceRecordService;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AttendanceRecordController {

    private final AttendanceRecordService service;

    public AttendanceRecordController(AttendanceRecordService service) {
        this.service = service;
    }

    @GetMapping("/attendance-records/{id}")
    public AttendanceRecordResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/attendance-sessions/{sessionId}/attendance-records")
    public List<AttendanceRecordListItemResponse> listBySession(@PathVariable Long sessionId) {
        return service.listBySession(sessionId);
    }

    @PostMapping("/attendance-records")
    @ResponseStatus(HttpStatus.CREATED)
    public AttendanceRecordResponse create(@Valid @RequestBody CreateAttendanceRecordRequest req) {
        return service.create(req);
    }

    @PutMapping("/attendance-records/{id}")
    public AttendanceRecordResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAttendanceRecordRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/attendance-records/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
