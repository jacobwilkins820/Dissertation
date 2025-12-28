package uk.ac.uclan.sis.sis_backend.enrolments.service;

import jakarta.persistence.EntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.enrolments.dto.*;
import uk.ac.uclan.sis.sis_backend.enrolments.entity.Enrolment;
import uk.ac.uclan.sis.sis_backend.enrolments.repository.EnrolmentRepository;

import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.time.LocalDate;
import java.util.List;

@Service
public class EnrolmentService {

    private final EnrolmentRepository repository;
    private final EntityManager em;
    private final AuthorizationService authorizationService;

    public EnrolmentService(
            EnrolmentRepository repository,
            EntityManager em,
            AuthorizationService authorizationService
    ) {
        this.repository = repository;
        this.em = em;
        this.authorizationService = authorizationService;
    }

    @Transactional
    public EnrolmentResponse create(CreateEnrolmentRequest req) {
        authorizationService.requireAdmin(currentUser());
        validateDates(req.getStartDate(), req.getEndDate());

        if (repository.existsByStudent_IdAndClazz_IdAndAcademicYear_Id(req.getStudentId(), req.getClassId(), req.getAcademicYearId())) {
            throw new IllegalArgumentException("Enrolment already exists for student + class + academic year.");
        }

        Enrolment e = new Enrolment();
        e.setStudent(em.getReference(Student.class, req.getStudentId()));
        e.setClazz(em.getReference(Class.class, req.getClassId()));
        e.setAcademicYear(em.getReference(AcademicYear.class, req.getAcademicYearId()));
        e.setStartDate(req.getStartDate());
        e.setEndDate(req.getEndDate());

        try {
            Enrolment saved = repository.save(e);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Invalid FK (studentId/classId/academicYearId) or duplicate enrolment.", ex);
        }
    }

    @Transactional(readOnly = true)
    public EnrolmentResponse getById(Long id) {
        authorizationService.requireAdmin(currentUser());
        Enrolment e = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Enrolment", "Enrolment not found: " + id));
        return toResponse(e);
    }

    @Transactional(readOnly = true)
    public List<EnrolmentListItemResponse> listByClass(Long classId, Long academicYearId) {
        authorizationService.requireAdmin(currentUser());
        return repository.findByClazz_IdAndAcademicYear_IdOrderByIdAsc(classId, academicYearId)
                .stream()
                .map(e -> new EnrolmentListItemResponse(
                        e.getId(),
                        e.getStudent().getId(),
                        e.getClazz().getId(),
                        e.getStartDate(),
                        e.getEndDate()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EnrolmentListItemResponse> listByStudent(Long studentId, Long academicYearId) {
        authorizationService.requireAdmin(currentUser());
        return repository.findByStudent_IdAndAcademicYear_IdOrderByIdAsc(studentId, academicYearId)
                .stream()
                .map(e -> new EnrolmentListItemResponse(
                        e.getId(),
                        e.getStudent().getId(),
                        e.getClazz().getId(),
                        e.getStartDate(),
                        e.getEndDate()
                ))
                .toList();
    }

    @Transactional
    public EnrolmentResponse update(Long id, UpdateEnrolmentRequest req) {
        authorizationService.requireAdmin(currentUser());
        validateDates(req.getStartDate(), req.getEndDate());

        Enrolment e = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Enrolment", "Enrolment not found: " + id));

        e.setStartDate(req.getStartDate());
        e.setEndDate(req.getEndDate());

        Enrolment saved = repository.save(e);
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        authorizationService.requireAdmin(currentUser());
        if (!repository.existsById(id)) {
            throw new NotFoundException("Enrolment", "Enrolment not found: " + id);
        }
        repository.deleteById(id);
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("endDate cannot be before startDate.");
        }
    }

    private EnrolmentResponse toResponse(Enrolment e) {
        return new EnrolmentResponse(
                e.getId(),
                e.getStudent().getId(),
                e.getClazz().getId(),
                e.getAcademicYear().getId(),
                e.getStartDate(),
                e.getEndDate(),
                e.getCreatedAt(),
                e.getUpdatedAt()
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
