package uk.ac.uclan.sis.sis_backend.enrolments.service;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import uk.ac.uclan.sis.sis_backend.academic_years.entity.AcademicYear;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.audit_log.service.AuditLogService;
import uk.ac.uclan.sis.sis_backend.enrolments.dto.EnrolmentListItemResponse;
import uk.ac.uclan.sis.sis_backend.enrolments.dto.EnrolmentResponse;
import uk.ac.uclan.sis.sis_backend.enrolments.dto.CreateEnrolmentRequest;
import uk.ac.uclan.sis.sis_backend.enrolments.dto.UpdateEnrolmentRequest;
import uk.ac.uclan.sis.sis_backend.enrolments.entity.Enrolment;
import uk.ac.uclan.sis.sis_backend.enrolments.repository.EnrolmentRepository;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.users.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrolmentServiceTest {

    @Mock
    private EnrolmentRepository repository;

    @Mock
    private EntityManager em;

    @Mock
    private AuthorizationService authorizationService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private EnrolmentService service;

    @BeforeEach
    void setUpSecurityContext() {
        Role role = new Role("ADMIN", 1023);
        User user = new User();
        user.setId(1L);
        user.setRole(role);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void create_rejectsEndDateBeforeStartDate() {
        CreateEnrolmentRequest req = new CreateEnrolmentRequest();
        req.setStudentId(1L);
        req.setClassId(2L);
        req.setAcademicYearId(3L);
        req.setStartDate(LocalDate.of(2024, 9, 10));
        req.setEndDate(LocalDate.of(2024, 9, 1));

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
        verifyNoInteractions(repository);
    }

    @Test
    void create_duplicateThrows() {
        CreateEnrolmentRequest req = new CreateEnrolmentRequest();
        req.setStudentId(1L);
        req.setClassId(2L);
        req.setAcademicYearId(3L);
        req.setStartDate(LocalDate.of(2024, 9, 1));

        when(repository.existsByStudent_IdAndClazz_IdAndAcademicYear_Id(1L, 2L, 3L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
        verify(repository, never()).save(any(Enrolment.class));
    }

    @Test
    void create_invalidFkThrows() {
        CreateEnrolmentRequest req = new CreateEnrolmentRequest();
        req.setStudentId(1L);
        req.setClassId(2L);
        req.setAcademicYearId(3L);
        req.setStartDate(LocalDate.of(2024, 9, 1));

        when(repository.existsByStudent_IdAndClazz_IdAndAcademicYear_Id(1L, 2L, 3L)).thenReturn(false);
        when(em.getReference(Student.class, 1L)).thenReturn(mock(Student.class));
        when(em.getReference(Class.class, 2L)).thenReturn(mock(Class.class));
        when(em.getReference(AcademicYear.class, 3L)).thenReturn(mock(AcademicYear.class));
        when(repository.save(any(Enrolment.class))).thenThrow(new DataIntegrityViolationException("fk"));

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
    }

    @Test
    void create_successReturnsResponse() {
        CreateEnrolmentRequest req = new CreateEnrolmentRequest();
        req.setStudentId(1L);
        req.setClassId(2L);
        req.setAcademicYearId(3L);
        req.setStartDate(LocalDate.of(2024, 9, 1));
        req.setEndDate(LocalDate.of(2025, 6, 1));

        Student student = mock(Student.class);
        Class clazz = mock(Class.class);
        AcademicYear ay = mock(AcademicYear.class);
        when(student.getId()).thenReturn(1L);
        when(clazz.getId()).thenReturn(2L);
        when(ay.getId()).thenReturn(3L);

        when(repository.existsByStudent_IdAndClazz_IdAndAcademicYear_Id(1L, 2L, 3L)).thenReturn(false);
        when(em.getReference(Student.class, 1L)).thenReturn(student);
        when(em.getReference(Class.class, 2L)).thenReturn(clazz);
        when(em.getReference(AcademicYear.class, 3L)).thenReturn(ay);

        when(repository.save(any(Enrolment.class))).thenAnswer(invocation -> {
            Enrolment saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 77L);
            ReflectionTestUtils.setField(saved, "createdAt", LocalDateTime.now());
            ReflectionTestUtils.setField(saved, "updatedAt", LocalDateTime.now());
            return saved;
        });

        EnrolmentResponse response = service.create(req);

        assertEquals(77L, response.getId());
        assertEquals(1L, response.getStudentId());
        assertEquals(2L, response.getClassId());
        assertEquals(3L, response.getAcademicYearId());
        assertEquals(LocalDate.of(2024, 9, 1), response.getStartDate());
        assertEquals(LocalDate.of(2025, 6, 1), response.getEndDate());
    }

    @Test
    void getById_missingThrows() {
        when(repository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.getById(9L));
    }

    @Test
    void getById_returnsResponse() {
        Student student = mock(Student.class);
        Class clazz = mock(Class.class);
        AcademicYear ay = mock(AcademicYear.class);
        when(student.getId()).thenReturn(10L);
        when(clazz.getId()).thenReturn(11L);
        when(ay.getId()).thenReturn(12L);

        Enrolment enrolment = new Enrolment();
        enrolment.setStudent(student);
        enrolment.setClazz(clazz);
        enrolment.setAcademicYear(ay);
        enrolment.setStartDate(LocalDate.of(2024, 9, 1));
        enrolment.setEndDate(LocalDate.of(2025, 6, 1));
        ReflectionTestUtils.setField(enrolment, "id", 5L);
        ReflectionTestUtils.setField(enrolment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(enrolment, "updatedAt", LocalDateTime.now());

        when(repository.findById(5L)).thenReturn(Optional.of(enrolment));

        EnrolmentResponse response = service.getById(5L);

        assertEquals(5L, response.getId());
        assertEquals(10L, response.getStudentId());
        assertEquals(11L, response.getClassId());
        assertEquals(12L, response.getAcademicYearId());
    }

    @Test
    void listByClass_mapsResults() {
        Enrolment e = buildEnrolment(1L, 2L, 3L);

        when(repository.findByClazz_IdAndAcademicYear_IdOrderByIdAsc(2L, 3L)).thenReturn(List.of(e));

        List<EnrolmentListItemResponse> result = service.listByClass(2L, 3L);

        assertEquals(1, result.size());
        EnrolmentListItemResponse item = result.get(0);
        assertEquals(1L, item.getId());
        assertEquals(10L, item.getStudentId());
        assertEquals(2L, item.getClassId());
        assertEquals(LocalDate.of(2024, 9, 1), item.getStartDate());
    }

    @Test
    void listByStudent_mapsResults() {
        Enrolment e = buildEnrolment(1L, 2L, 3L);

        when(repository.findByStudent_IdAndAcademicYear_IdOrderByIdAsc(10L, 3L)).thenReturn(List.of(e));

        List<EnrolmentListItemResponse> result = service.listByStudent(10L, 3L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(10L, result.get(0).getStudentId());
    }

    @Test
    void update_rejectsEndDateBeforeStartDate() {
        UpdateEnrolmentRequest req = new UpdateEnrolmentRequest();
        req.setStartDate(LocalDate.of(2024, 9, 10));
        req.setEndDate(LocalDate.of(2024, 9, 1));

        assertThrows(IllegalArgumentException.class, () -> service.update(1L, req));
        verifyNoInteractions(repository);
    }

    @Test
    void update_missingThrows() {
        UpdateEnrolmentRequest req = new UpdateEnrolmentRequest();
        req.setStartDate(LocalDate.of(2024, 9, 1));

        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.update(1L, req));
    }

    @Test
    void update_successUpdatesDates() {
        Enrolment enrolment = buildEnrolment(2L, 20L, 30L);

        UpdateEnrolmentRequest req = new UpdateEnrolmentRequest();
        req.setStartDate(LocalDate.of(2024, 10, 1));
        req.setEndDate(LocalDate.of(2025, 7, 1));

        when(repository.findById(2L)).thenReturn(Optional.of(enrolment));
        when(repository.save(enrolment)).thenReturn(enrolment);

        EnrolmentResponse response = service.update(2L, req);

        assertEquals(LocalDate.of(2024, 10, 1), response.getStartDate());
        assertEquals(LocalDate.of(2025, 7, 1), response.getEndDate());
    }

    @Test
    void delete_missingThrows() {
        when(repository.findById(3L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.delete(3L));
        verify(repository, never()).deleteById(anyLong());
    }

    @Test
    void delete_existingDeletes() {
        Enrolment enrolment = buildEnrolment(3L, 2L, 3L);
        when(repository.findById(3L)).thenReturn(Optional.of(enrolment));

        service.delete(3L);

        verify(repository).deleteById(3L);
    }

    private Enrolment buildEnrolment(Long enrolmentId, Long classId, Long academicYearId) {
        Student student = mock(Student.class);
        Class clazz = mock(Class.class);
        AcademicYear ay = mock(AcademicYear.class);
        when(student.getId()).thenReturn(10L);
        when(clazz.getId()).thenReturn(classId);

        Enrolment enrolment = new Enrolment();
        enrolment.setStudent(student);
        enrolment.setClazz(clazz);
        enrolment.setAcademicYear(ay);
        enrolment.setStartDate(LocalDate.of(2024, 9, 1));
        enrolment.setEndDate(LocalDate.of(2025, 6, 1));
        ReflectionTestUtils.setField(enrolment, "id", enrolmentId);
        ReflectionTestUtils.setField(enrolment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(enrolment, "updatedAt", LocalDateTime.now());
        return enrolment;
    }
}
