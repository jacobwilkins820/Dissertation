package uk.ac.uclan.sis.sis_backend.classes.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import uk.ac.uclan.sis.sis_backend.academic_years.service.AcademicYearService;
import uk.ac.uclan.sis.sis_backend.auth.security.AuthorizationService;
import uk.ac.uclan.sis.sis_backend.audit_log.service.AuditLogService;
import uk.ac.uclan.sis.sis_backend.classes.dto.ClassListItemResponse;
import uk.ac.uclan.sis.sis_backend.classes.dto.ClassResponse;
import uk.ac.uclan.sis.sis_backend.classes.dto.CreateClassRequest;
import uk.ac.uclan.sis.sis_backend.classes.dto.UpdateClassRequest;
import uk.ac.uclan.sis.sis_backend.classes.entity.Class;
import uk.ac.uclan.sis.sis_backend.classes.repository.ClassRepository;
import uk.ac.uclan.sis.sis_backend.common.exception.NotFoundException;
import uk.ac.uclan.sis.sis_backend.email.service.EmailService;
import uk.ac.uclan.sis.sis_backend.enrolments.repository.EnrolmentRepository;
import uk.ac.uclan.sis.sis_backend.roles.entity.Role;
import uk.ac.uclan.sis.sis_backend.student_guardians.repository.StudentGuardianRepository;
import uk.ac.uclan.sis.sis_backend.users.entity.User;
import uk.ac.uclan.sis.sis_backend.users.repository.UserRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClassServiceTest {

    @Mock
    private ClassRepository classRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthorizationService authorizationService;

    @Mock
    private EnrolmentRepository enrolmentRepository;

    @Mock
    private StudentGuardianRepository studentGuardianRepository;

    @Mock
    private AcademicYearService academicYearService;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ClassService service;

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
    void create_requiresName() {
        CreateClassRequest req = new CreateClassRequest();
        req.setName(null);

        assertThrows(IllegalArgumentException.class, () -> service.create(req));
        verifyNoInteractions(classRepository);
    }

    @Test
    void create_trimsNameNormalizesCodeAndDefaultsActive() {
        CreateClassRequest req = new CreateClassRequest();
        req.setName("  Maths ");
        req.setCode("  ");
        req.setActive(null);

        when(classRepository.save(any(Class.class))).thenAnswer(invocation -> {
            Class saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 11L);
            return saved;
        });

        ClassResponse response = service.create(req);

        ArgumentCaptor<Class> captor = ArgumentCaptor.forClass(Class.class);
        verify(classRepository).save(captor.capture());

        Class saved = captor.getValue();
        assertEquals("Maths", saved.getName());
        assertNull(saved.getCode());
        assertTrue(saved.isActive());

        assertEquals(11L, response.getId());
        assertEquals("Maths", response.getName());
        assertNull(response.getCode());
        assertTrue(response.isActive());
    }

    @Test
    void create_assignsTeacherWhenProvided() {
        CreateClassRequest req = new CreateClassRequest();
        req.setName("History");
        req.setTeacherId(5L);

        User teacher = buildUser(5L, "Ada", "Lovelace");

        when(userRepository.findById(5L)).thenReturn(Optional.of(teacher));
        when(classRepository.save(any(Class.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(req);

        ArgumentCaptor<Class> captor = ArgumentCaptor.forClass(Class.class);
        verify(classRepository).save(captor.capture());

        Class saved = captor.getValue();
        assertEquals(teacher, saved.getTeacher());
    }

    @Test
    void listAll_mapsToListItems() {
        Class c = new Class();
        ReflectionTestUtils.setField(c, "id", 1L);
        c.setName("Maths");
        c.setCode("M1");
        c.setActive(true);

        when(classRepository.findAll()).thenReturn(List.of(c));

        List<ClassListItemResponse> result = service.listAll();

        assertEquals(1, result.size());
        ClassListItemResponse item = result.get(0);
        assertEquals(1L, item.getId());
        assertEquals("Maths", item.getName());
        assertEquals("M1", item.getCode());
        assertTrue(item.isActive());
    }

    @Test
    void getById_missingThrows() {
        when(classRepository.findById(44L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getById(44L));
    }

    @Test
    void getById_withTeacherBuildsName() {
        User teacher = buildUser(7L, "Ada", "Lovelace");

        Class c = new Class();
        ReflectionTestUtils.setField(c, "id", 3L);
        c.setName("Science");
        c.setCode("S1");
        c.setActive(true);
        c.setTeacher(teacher);

        when(classRepository.findById(3L)).thenReturn(Optional.of(c));

        ClassResponse response = service.getById(3L);

        assertEquals(3L, response.getId());
        assertEquals(7L, response.getTeacherId());
        assertEquals("Ada Lovelace", response.getTeacherName());
    }

    @Test
    void update_emptyNameThrows() {
        Class c = new Class();
        c.setName("Maths");

        UpdateClassRequest req = new UpdateClassRequest();
        req.setName("   ");

        when(classRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThrows(IllegalArgumentException.class, () -> service.update(1L, req));
    }

    @Test
    void update_changesFields() {
        Class c = new Class();
        c.setName("Maths");
        c.setCode("M1");
        c.setActive(true);

        UpdateClassRequest req = new UpdateClassRequest();
        req.setName("Maths Advanced");
        req.setCode("  M2 ");
        req.setActive(false);
        req.setTeacherId(9L);

        User teacher = buildUser(9L, "Alan", "Turing");

        when(classRepository.findById(1L)).thenReturn(Optional.of(c));
        when(userRepository.findById(9L)).thenReturn(Optional.of(teacher));
        when(classRepository.save(c)).thenReturn(c);

        ClassResponse response = service.update(1L, req);

        assertEquals("Maths Advanced", c.getName());
        assertEquals("M2", c.getCode());
        assertFalse(c.isActive());
        assertEquals(teacher, c.getTeacher());
        assertEquals("Maths Advanced", response.getName());
        assertEquals("M2", response.getCode());
        assertFalse(response.isActive());
    }

    @Test
    void unassignTeacher_clearsTeacher() {
        User teacher = buildUser(2L, "Grace", "Hopper");
        Class c = new Class();
        c.setTeacher(teacher);

        when(classRepository.findById(5L)).thenReturn(Optional.of(c));

        service.unassignTeacher(5L);

        assertNull(c.getTeacher());
        verify(classRepository).save(c);
    }

    @Test
    void delete_missingThrows() {
        when(classRepository.findById(3L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.delete(3L));
        verify(classRepository, never()).deleteById(anyLong());
    }

    @Test
    void delete_existingDeletes() {
        Class c = new Class();
        c.setName("Maths");
        when(classRepository.findById(3L)).thenReturn(Optional.of(c));

        service.delete(3L);

        verify(classRepository).deleteById(3L);
    }

    private User buildUser(Long id, String first, String last) {
        User user = new User();
        user.setId(id);
        user.setFirstName(first);
        user.setLastName(last);
        return user;
    }
}
