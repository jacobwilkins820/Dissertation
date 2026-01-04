package uk.ac.uclan.sis.sis_backend.guardians.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianRequest;
import uk.ac.uclan.sis.sis_backend.guardians.dto.CreateGuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianContactResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianResponse;
import uk.ac.uclan.sis.sis_backend.guardians.dto.GuardianSearchResponse;
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

    @GetMapping
    public ResponseEntity<Page<GuardianResponse>> list(
            @RequestParam(value = "q", required = false) String q,
            Pageable pageable
    ) {
        return ResponseEntity.ok(guardianService.list(q, pageable));
    }

    @GetMapping(params = "query")
    public ResponseEntity<List<GuardianSearchResponse>> search(
            @RequestParam("query") String query
    ) {
        return ResponseEntity.ok(guardianService.search(query));
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
