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

    /**
     * Sets up the guardian controller.
     *
     * @param guardianService service for guardian operations
     */
    public GuardianController(GuardianService guardianService) {
        this.guardianService = guardianService;
    }

    /**
     * Creates a guardian.
     *
     * @param request create request body
     * @return created guardian summary
     */
    @PostMapping
    public ResponseEntity<CreateGuardianResponse> create(@Valid @RequestBody CreateGuardianRequest request) {
        CreateGuardianResponse response = guardianService.create(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Gets a guardian by id.
     *
     * @param id guardian id
     * @return guardian response
     */
    @GetMapping("/{id}")
    public ResponseEntity<GuardianResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(guardianService.getById(id));
    }

    /**
     * Gets guardian contact details by id.
     *
     * @param id guardian id
     * @return guardian contact response
     */
    @GetMapping("/{id}/contact")
    public ResponseEntity<GuardianContactResponse> getContact(@PathVariable Long id) {
        return ResponseEntity.ok(guardianService.getContactById(id));
    }

    /**
     * Gets a paged list of guardians with optional search.
     *
     * @param q search term
     * @param pageable paging request
     * @return page of guardians
     */
    @GetMapping
    public ResponseEntity<Page<GuardianResponse>> list(
            @RequestParam(value = "q", required = false) String q,
            Pageable pageable
    ) {
        return ResponseEntity.ok(guardianService.list(q, pageable));
    }

    /**
     * Gets a limited search list for guardian linking.
     *
     * @param query search term
     * @return guardian search responses
     */
    @GetMapping(params = "query")
    public ResponseEntity<List<GuardianSearchResponse>> search(
            @RequestParam("query") String query
    ) {
        return ResponseEntity.ok(guardianService.search(query));
    }

    /**
     * Gets a limited search list for guardian linking.
     *
     * @param query search term
     * @return guardian search responses
     */
    @GetMapping("/search")
    public ResponseEntity<List<GuardianSearchResponse>> searchByPath(
            @RequestParam("query") String query
    ) {
        return ResponseEntity.ok(guardianService.search(query));
    }

    /**
     * Updates a guardian by id.
     *
     * @param id guardian id
     * @param request update request body
     * @return updated guardian summary
     */
    @PutMapping("/{id}")
    public ResponseEntity<CreateGuardianResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGuardianRequest request
    ) {
        // Update Gets a summary response (id + name).
        return ResponseEntity.ok(guardianService.update(id, request));
    }

    /**
     * Deletes a guardian by id.
     *
     * @param id guardian id
     * @return empty response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        guardianService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
