package uk.ac.uclan.sis.sis_backend.guardians.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianContactResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.UpdateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.service.GuardianService;

@RestController
@RequestMapping("/api/guardians")
public class GuardianController {

    private final GuardianService guardianService;

    public GuardianController(GuardianService guardianService) {
        this.guardianService = guardianService;
    }

    @PostMapping
    public ResponseEntity<CreateGuardianResponse> create(@Valid @RequestBody CreateGuardianRequest request) {
        CreateGuardianResponse response = guardianService.create(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GuardianResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(guardianService.getById(id));
    }

    @GetMapping("/{id}/contact")
    public ResponseEntity<GuardianContactResponse> getContact(@PathVariable Long id) {
        return ResponseEntity.ok(guardianService.getContactById(id));
    }

    //TODO: delete later
    /** 
     * Example calls:
     *  - GET /api/guardians?page=0&size=20
     *  - GET /api/guardians?q=smith&page=0&size=20&sort=lastName,asc
     *
     * Spring auto-builds Pageable from query params (page, size, sort).
     */
    @GetMapping
    public ResponseEntity<Page<GuardianResponse>> list(
            @RequestParam(value = "q", required = false) String q,
            Pageable pageable
    ) {
        return ResponseEntity.ok(guardianService.list(q, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CreateGuardianResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGuardianRequest request
    ) {
        // Update returns CreateGuardianResponse in your service (id + name),
        // which is totally fine as a lightweight "updated summary".
        return ResponseEntity.ok(guardianService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        guardianService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
