package uk.ac.uclan.sis.sis_backend.students.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import uk.ac.uclan.sis.sis_backend.students.dto.CreateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.dto.StudentResponse;
import uk.ac.uclan.sis.sis_backend.students.dto.UpdateStudentRequest;
import uk.ac.uclan.sis.sis_backend.students.entity.Student;
import uk.ac.uclan.sis.sis_backend.students.mapper.StudentMapper;
import uk.ac.uclan.sis.sis_backend.students.repository.StudentRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository repository;

    @Mock
    private StudentMapper mapper;

    @InjectMocks
    private StudentService service;

    @Test
    void getById_returnsMappedResponse() {
        Student student = new Student();

        StudentResponse mapped = new StudentResponse(
                1L,
                "U123",
                "Ada",
                "Lovelace",
                LocalDate.of(2008, 1, 1),
                "F",
                "ACTIVE",
                null,
                null
        );

        when(repository.findById(1L)).thenReturn(Optional.of(student));
        when(mapper.toResponse(student)).thenReturn(mapped);

        StudentResponse response = service.getById(1L);

        assertEquals("U123", response.getUpn());
        assertEquals("Ada", response.getFirstName());
    }

    @Test
    void getById_missingThrows404() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getById(99L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void list_withoutQueryUsesFindAll() {
        Pageable pageable = PageRequest.of(0, 10);
        Student student = new Student();
        Page<Student> page = new PageImpl<>(List.of(student), pageable, 1);

        when(repository.findAll(pageable)).thenReturn(page);
        when(mapper.toResponse(student)).thenReturn(new StudentResponse(
                1L,
                "U1",
                "Ada",
                "Lovelace",
                LocalDate.of(2008, 1, 1),
                "F",
                "ACTIVE",
                null,
                null
        ));

        Page<StudentResponse> result = service.list(" ", pageable);

        assertEquals(1, result.getTotalElements());
        verify(repository, never()).search(anyString(), any(Pageable.class));
    }

    @Test
    void list_withQueryUsesSearch() {
        Pageable pageable = PageRequest.of(0, 10);
        Student student = new Student();
        Page<Student> page = new PageImpl<>(List.of(student), pageable, 1);

        when(repository.search("smith", pageable)).thenReturn(page);
        when(mapper.toResponse(student)).thenReturn(new StudentResponse(
                1L,
                "U2",
                "Grace",
                "Hopper",
                LocalDate.of(2007, 1, 1),
                "F",
                "ACTIVE",
                null,
                null
        ));

        Page<StudentResponse> result = service.list("  smith  ", pageable);

        assertEquals(1, result.getTotalElements());
        verify(repository, never()).findAll(pageable);
    }

    @Test
    void create_duplicateUpnThrows409() {
        CreateStudentRequest req = new CreateStudentRequest();
        req.setUpn("U1");
        req.setFirstName("Ada");
        req.setLastName("Lovelace");
        req.setDateOfBirth(LocalDate.of(2008, 1, 1));
        req.setStatus("ACTIVE");

        when(repository.existsByUpn("U1")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.create(req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(repository, never()).save(any(Student.class));
    }

    @Test
    void create_savesAndReturnsMappedResponse() {
        CreateStudentRequest req = new CreateStudentRequest();
        req.setUpn("U1");
        req.setFirstName("Ada");
        req.setLastName("Lovelace");
        req.setDateOfBirth(LocalDate.of(2008, 1, 1));
        req.setStatus("ACTIVE");

        Student student = new Student();
        when(repository.existsByUpn("U1")).thenReturn(false);
        when(mapper.toEntity(req)).thenReturn(student);
        when(repository.save(student)).thenReturn(student);
        when(mapper.toResponse(student)).thenReturn(new StudentResponse(
                1L,
                "U1",
                "Ada",
                "Lovelace",
                LocalDate.of(2008, 1, 1),
                "F",
                "ACTIVE",
                null,
                null
        ));

        StudentResponse response = service.create(req);

        assertEquals("U1", response.getUpn());
        verify(repository).save(student);
    }

    @Test
    void update_missingThrows404() {
        UpdateStudentRequest req = new UpdateStudentRequest();
        req.setUpn("U1");
        req.setFirstName("Ada");
        req.setLastName("Lovelace");
        req.setDateOfBirth(LocalDate.of(2008, 1, 1));
        req.setStatus("ACTIVE");

        when(repository.findById(1L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.update(1L, req));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void update_duplicateUpnThrows409() {
        UpdateStudentRequest req = new UpdateStudentRequest();
        req.setUpn("U1");
        req.setFirstName("Ada");
        req.setLastName("Lovelace");
        req.setDateOfBirth(LocalDate.of(2008, 1, 1));
        req.setStatus("ACTIVE");

        Student existing = new Student();
        Student other = new Student();
        ReflectionTestUtils.setField(other, "id", 99L);

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.findByUpn("U1")).thenReturn(Optional.of(other));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.update(1L, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void update_sameUpnAllowsUpdate() {
        UpdateStudentRequest req = new UpdateStudentRequest();
        req.setUpn("U1");
        req.setFirstName("Ada");
        req.setLastName("Lovelace");
        req.setDateOfBirth(LocalDate.of(2008, 1, 1));
        req.setStatus("ACTIVE");

        Student existing = new Student();
        ReflectionTestUtils.setField(existing, "id", 1L);

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.findByUpn("U1")).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);
        when(mapper.toResponse(existing)).thenReturn(new StudentResponse(
                1L,
                "U1",
                "Ada",
                "Lovelace",
                LocalDate.of(2008, 1, 1),
                "F",
                "ACTIVE",
                null,
                null
        ));

        StudentResponse response = service.update(1L, req);

        assertEquals("U1", response.getUpn());
        verify(mapper).applyUpdate(existing, req);
    }

    @Test
    void delete_missingThrows404() {
        when(repository.existsById(10L)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.delete(10L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(repository, never()).deleteById(anyLong());
    }

    @Test
    void delete_existingDeletes() {
        when(repository.existsById(10L)).thenReturn(true);

        service.delete(10L);

        verify(repository).deleteById(10L);
    }
}
