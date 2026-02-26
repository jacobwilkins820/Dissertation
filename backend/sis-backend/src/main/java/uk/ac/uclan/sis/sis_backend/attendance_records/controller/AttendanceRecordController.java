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

    /**
     * Sets up the attendance record controller.
     *
     * @param service service for attendance records
     */
    public AttendanceRecordController(AttendanceRecordService service) {
        this.service = service;
    }

    /**
     * Gets an attendance record by id.
     *
     * @param id record id
     * @return attendance record response
     */
    @GetMapping("/attendance-records/{id}")
    public AttendanceRecordResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    /**
     * Gets records for a session.
     *
     * @param sessionId session id
     * @return list of attendance record list items
     */
    @GetMapping("/attendance-sessions/{sessionId}/attendance-records")
    public List<AttendanceRecordListItemResponse> listBySession(@PathVariable Long sessionId) {
        return service.listBySession(sessionId);
    }

    /**
     * Saves attendance marks for a session in one operation.
     *
     * @param sessionId session id
     * @param req save request body
     * @return saved attendance record responses
     */
    @PutMapping("/attendance-sessions/{sessionId}/attendance-records")
    public List<AttendanceRecordResponse> saveForSession(
            @PathVariable Long sessionId,
            @Valid @RequestBody SaveAttendanceForSessionRequest req
    ) {
        return service.saveForSession(sessionId, req);
    }

    /**
     * Creates an attendance record.
     *
     * @param req create request body
     * @return created attendance record response
     */
    @PostMapping("/attendance-records")
    @ResponseStatus(HttpStatus.CREATED)
    public AttendanceRecordResponse create(@Valid @RequestBody CreateAttendanceRecordRequest req) {
        return service.create(req);
    }

    /**
     * Updates an attendance record by id.
     *
     * @param id record id
     * @param req update request body
     * @return updated attendance record response
     */
    @PutMapping("/attendance-records/{id}")
    public AttendanceRecordResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAttendanceRecordRequest req) {
        return service.update(id, req);
    }

    /**
     * Deletes an attendance record by id.
     *
     * @param id record id
     */
    @DeleteMapping("/attendance-records/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
