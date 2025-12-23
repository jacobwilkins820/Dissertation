package uk.ac.uclan.sis.sis_backend.studentguardians.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.guardians.entity.Guardian;
import uk.ac.uclan.sis.sis_backend.guardians.repository.GuardianRepository;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.students.repository.StudentRepository;
import uk.ac.uclan.sis.sis_backend.studentguardians.dto.StudentGuardianResponse;
import uk.ac.uclan.sis.sis_backend.studentguardians.dto.UpsertStudentGuardianLinkRequest;
import uk.ac.uclan.sis.sis_backend.studentguardians.entity.StudentGuardian;
import uk.ac.uclan.sis.sis_backend.studentguardians.entity.StudentGuardianId;
import uk.ac.uclan.sis.sis_backend.studentguardians.repository.StudentGuardianRepository;

import java.util.List;

@Service
public class StudentGuardianService {

    private final StudentGuardianRepository studentGuardianRepository;
    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;

    public StudentGuardianService(
            StudentGuardianRepository studentGuardianRepository,
            StudentRepository studentRepository,
            GuardianRepository guardianRepository
    ) {
        this.studentGuardianRepository = studentGuardianRepository;
        this.studentRepository = studentRepository;
        this.guardianRepository = guardianRepository;
    }

    /**
     * Create or update the link between a student and guardian.
     */
    @Transactional
    public StudentGuardianResponse upsertLink(Long studentId, Long guardianId, UpsertStudentGuardianLinkRequest request) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student", "Student not found: " + studentId));

        Guardian guardian = guardianRepository.findById(guardianId)
                .orElseThrow(() -> new NotFoundException("Guardian", "Guardian not found: " + guardianId));

        boolean primary = request.getIsPrimary() != null && request.getIsPrimary();

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

    @Transactional(readOnly = true)
    public List<StudentGuardianResponse> listByStudent(Long studentId) {
        // Explicit 404 if the student doesn't exist
        if (!studentRepository.existsById(studentId)) {
            throw new NotFoundException("Student", "Student not found: " + studentId);
        }

        return studentGuardianRepository.findByIdStudentId(studentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentGuardianResponse> listByGuardian(Long guardianId) {
        if (!guardianRepository.existsById(guardianId)) {
            throw new NotFoundException("Guardian", "Guardian not found: " + guardianId);
        }

        return studentGuardianRepository.findByIdGuardianId(guardianId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteLink(Long studentId, Long guardianId) {
        StudentGuardianId id = new StudentGuardianId(studentId, guardianId);

        if (!studentGuardianRepository.existsById(id)) {
            // Join-table delete should still be strict: if you asked to delete a link that isn't there, that's a client bug.
            throw new NotFoundException("StudentGuardian", "Student-Guardian link not found: studentId=" + studentId + ", guardianId=" + guardianId);
        }

        studentGuardianRepository.deleteById(id);
    }

    private StudentGuardianResponse toResponse(StudentGuardian link) {
        return new StudentGuardianResponse(
                link.getStudent().getFirstName(),
                link.getStudent().getLastName(),
                link.getGuardian().getFirstName(),
                link.getGuardian().getLastName(),
                link.getRelationship(),
                link.isPrimary()
        );
    }
}