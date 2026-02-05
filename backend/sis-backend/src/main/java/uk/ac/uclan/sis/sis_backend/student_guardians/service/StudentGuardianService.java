package uk.ac.uclan.sis.sis_backend.student_guardians.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;
import uk.ac.uclan.sis.sis_backend.guardians.repository.GuardianRepository;
import uk.ac.uclan.sis.sis_backend.student_guardians.dto.StudentGuardianResponse;
import uk.ac.uclan.sis.sis_backend.student_guardians.dto.UpsertStudentGuardianLinkRequest;
import uk.ac.uclan.sis.sis_backend.student_guardians.entity.StudentGuardian;
import uk.ac.uclan.sis.sis_backend.student_guardians.entity.StudentGuardianId;
import uk.ac.uclan.sis.sis_backend.student_guardians.repository.StudentGuardianRepository;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.students.repository.StudentRepository;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.util.List;

@Service
public class StudentGuardianService {

    private final StudentGuardianRepository studentGuardianRepository;
    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final AuthorizationService authorizationService;

    /**
     * Creates the student-guardian service.
     *
     * @param studentGuardianRepository repository for link access
     * @param studentRepository repository for students
     * @param guardianRepository repository for guardians
     * @param authorizationService service for permission checks
     */
    public StudentGuardianService(
            StudentGuardianRepository studentGuardianRepository,
            StudentRepository studentRepository,
            GuardianRepository guardianRepository,
            AuthorizationService authorizationService
    ) {
        this.studentGuardianRepository = studentGuardianRepository;
        this.studentRepository = studentRepository;
        this.guardianRepository = guardianRepository;
        this.authorizationService = authorizationService;
    }

    /**
     * Creates or updates a student-guardian link.
     *
     * @param studentId student id
     * @param guardianId guardian id
     * @param request link request payload
     * @return student-guardian response
     */
    @Transactional
    public StudentGuardianResponse upsertLink(Long studentId, Long guardianId, UpsertStudentGuardianLinkRequest request) {
        authorizationService.requireAdmin(currentUser());
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student", "Student not found: " + studentId));

        Guardian guardian = guardianRepository.findById(guardianId)
                .orElseThrow(() -> new NotFoundException("Guardian", "Guardian not found: " + guardianId));

        boolean primary = request.getIsPrimary() != null && request.getIsPrimary();

        if (primary) {
            studentGuardianRepository.clearOtherPrimaryGuardians(studentId, guardianId);
        }

        StudentGuardian link = studentGuardianRepository
                .findByIdStudentIdAndIdGuardianId(studentId, guardianId)
                .orElseGet(() -> new StudentGuardian(student, guardian, request.getRelationship().trim(), primary));

        // If it already existed, apply updates.
        link.setRelationship(request.getRelationship().trim());
        link.setPrimary(primary);

        StudentGuardian saved = studentGuardianRepository.save(link);

        // "primary" should mean a single main contact per student.
        // If setting this link to primary, clear other primary flags.
        if (saved.isPrimary()) {
            studentGuardianRepository.clearOtherPrimaryGuardians(studentId, guardianId);
        }

        return toResponse(saved);
    }

    /**
     * Returns links for a student.
     *
     * @param studentId student id
     * @return list of student-guardian responses
     */
    @Transactional(readOnly = true)
    public List<StudentGuardianResponse> listByStudent(Long studentId) {
        authorizationService.requireAdmin(currentUser());
        // Explicit 404 if the student doesn't exist
        if (!studentRepository.existsById(studentId)) {
            throw new NotFoundException("Student", "Student not found: " + studentId);
        }

        return studentGuardianRepository.findByIdStudentId(studentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns links for a guardian.
     *
     * @param guardianId guardian id
     * @return list of student-guardian responses
     */
    @Transactional(readOnly = true)
    public List<StudentGuardianResponse> listByGuardian(Long guardianId) {
        User user = currentUser();
        if (!isAdmin(user)) {
            Long linkedGuardianId = user.getLinkedGuardianId();
            if (linkedGuardianId == null || !linkedGuardianId.equals(guardianId)) {
                if (isParent(user)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
                }
                authorizationService.require(user, uk.ac.uclan.sis.sis_backend.roles.Permissions.VIEW_STUDENT_DETAILS);
            }
        }
        if (!guardianRepository.existsById(guardianId)) {
            throw new NotFoundException("Guardian", "Guardian not found: " + guardianId);
        }

        return studentGuardianRepository.findByIdGuardianId(guardianId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Deletes a student-guardian link.
     *
     * @param studentId student id
     * @param guardianId guardian id
     */
    @Transactional
    public void deleteLink(Long studentId, Long guardianId) {
        authorizationService.requireAdmin(currentUser());
        StudentGuardianId id = new StudentGuardianId(studentId, guardianId);

        if (!studentGuardianRepository.existsById(id)) {
            // Join-table delete remains strict when the link is missing.
            throw new NotFoundException("StudentGuardian", "Student-Guardian link not found: studentId=" + studentId + ", guardianId=" + guardianId);
        }

        studentGuardianRepository.deleteById(id);
    }

    /**
     * Maps a link entity to a response.
     *
     * @param link student-guardian link
     * @return student-guardian response
     */
    private StudentGuardianResponse toResponse(StudentGuardian link) {
        Long studentId = link.getId() != null
                ? link.getId().getStudentId()
                : link.getStudent().getId();
        Long guardianId = link.getId() != null
                ? link.getId().getGuardianId()
                : link.getGuardian().getId();
        return new StudentGuardianResponse(
                studentId,
                guardianId,
                link.getStudent().getFirstName(),
                link.getStudent().getLastName(),
                link.getGuardian().getFirstName(),
                link.getGuardian().getLastName(),
                link.getRelationship(),
                link.isPrimary()
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

    /**
     * Returns true when the user has an admin role.
     *
     * @param user current user
     * @return true when admin
     */
    private boolean isAdmin(User user) {
        String roleName = user.getRole() == null ? null : user.getRole().getName();
        return roleName != null && roleName.equalsIgnoreCase("ADMIN");
    }

    /**
     * Returns true when the user has a parent role.
     *
     * @param user current user
     * @return true when parent
     */
    private boolean isParent(User user) {
        String roleName = user.getRole() == null ? null : user.getRole().getName();
        return roleName != null && roleName.equalsIgnoreCase("PARENT");
    }
}
