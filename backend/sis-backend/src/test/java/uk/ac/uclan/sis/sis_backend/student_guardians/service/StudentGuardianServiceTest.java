package uk.ac.uclan.sis.sis_backend.student_guardians.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentGuardianServiceTest {

    @Mock
    private StudentGuardianRepository studentGuardianRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private GuardianRepository guardianRepository;

    @InjectMocks
    private StudentGuardianService service;

    @Test
    void upsertLink_createsNewAndClearsOtherPrimary() {
        Student student = buildStudent(1L, "Amy", "Adams");
        Guardian guardian = buildGuardian(2L, "Bob", "Brown");

        UpsertStudentGuardianLinkRequest req = new UpsertStudentGuardianLinkRequest();
        req.setRelationship("  Father ");
        req.setIsPrimary(true);

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(guardianRepository.findById(2L)).thenReturn(Optional.of(guardian));
        when(studentGuardianRepository.findByIdStudentIdAndIdGuardianId(1L, 2L)).thenReturn(Optional.empty());
        when(studentGuardianRepository.save(any(StudentGuardian.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        StudentGuardianResponse response = service.upsertLink(1L, 2L, req);

        ArgumentCaptor<StudentGuardian> captor = ArgumentCaptor.forClass(StudentGuardian.class);
        verify(studentGuardianRepository).save(captor.capture());

        StudentGuardian saved = captor.getValue();
        assertEquals("Father", saved.getRelationship());
        assertTrue(saved.isPrimary());
        assertEquals(student, saved.getStudent());
        assertEquals(guardian, saved.getGuardian());

        verify(studentGuardianRepository).clearOtherPrimaryGuardians(1L, 2L);

        assertEquals("Amy", response.getStudentFirstName());
        assertEquals("Adams", response.getStudentLastName());
        assertEquals("Bob", response.getGuardianFirstName());
        assertEquals("Brown", response.getGuardianLastName());
        assertEquals("Father", response.getRelationship());
        assertTrue(response.isPrimary());
    }

    @Test
    void upsertLink_updatesExistingDoesNotClearWhenNotPrimary() {
        Student student = buildStudent(1L, "Amy", "Adams");
        Guardian guardian = buildGuardian(2L, "Bob", "Brown");
        StudentGuardian existing = new StudentGuardian(student, guardian, "Mother", true);

        UpsertStudentGuardianLinkRequest req = new UpsertStudentGuardianLinkRequest();
        req.setRelationship(" Carer ");
        req.setIsPrimary(null);

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(guardianRepository.findById(2L)).thenReturn(Optional.of(guardian));
        when(studentGuardianRepository.findByIdStudentIdAndIdGuardianId(1L, 2L))
                .thenReturn(Optional.of(existing));
        when(studentGuardianRepository.save(existing)).thenReturn(existing);

        StudentGuardianResponse response = service.upsertLink(1L, 2L, req);

        assertEquals("Carer", existing.getRelationship());
        assertFalse(existing.isPrimary());
        verify(studentGuardianRepository, never()).clearOtherPrimaryGuardians(anyLong(), anyLong());

        assertEquals("Carer", response.getRelationship());
        assertFalse(response.isPrimary());
    }

    @Test
    void upsertLink_missingStudentThrows() {
        UpsertStudentGuardianLinkRequest req = new UpsertStudentGuardianLinkRequest();
        req.setRelationship("Parent");

        when(studentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.upsertLink(1L, 2L, req));
    }

    @Test
    void listByStudent_missingStudentThrows() {
        when(studentRepository.existsById(9L)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> service.listByStudent(9L));
    }

    @Test
    void listByStudent_mapsResponses() {
        Student student = buildStudent(1L, "Amy", "Adams");
        Guardian guardian = buildGuardian(2L, "Bob", "Brown");
        StudentGuardian link = new StudentGuardian(student, guardian, "Parent", true);

        when(studentRepository.existsById(1L)).thenReturn(true);
        when(studentGuardianRepository.findByIdStudentId(1L)).thenReturn(List.of(link));

        List<StudentGuardianResponse> result = service.listByStudent(1L);

        assertEquals(1, result.size());
        assertEquals("Amy", result.get(0).getStudentFirstName());
        assertEquals("Brown", result.get(0).getGuardianLastName());
        assertTrue(result.get(0).isPrimary());
    }

    @Test
    void listByGuardian_missingGuardianThrows() {
        when(guardianRepository.existsById(9L)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> service.listByGuardian(9L));
    }

    @Test
    void listByGuardian_mapsResponses() {
        Student student = buildStudent(1L, "Amy", "Adams");
        Guardian guardian = buildGuardian(2L, "Bob", "Brown");
        StudentGuardian link = new StudentGuardian(student, guardian, "Parent", false);

        when(guardianRepository.existsById(2L)).thenReturn(true);
        when(studentGuardianRepository.findByIdGuardianId(2L)).thenReturn(List.of(link));

        List<StudentGuardianResponse> result = service.listByGuardian(2L);

        assertEquals(1, result.size());
        assertEquals("Bob", result.get(0).getGuardianFirstName());
        assertFalse(result.get(0).isPrimary());
    }

    @Test
    void deleteLink_missingThrows() {
        StudentGuardianId id = new StudentGuardianId(1L, 2L);
        when(studentGuardianRepository.existsById(id)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> service.deleteLink(1L, 2L));
        verify(studentGuardianRepository, never()).deleteById(any(StudentGuardianId.class));
    }

    @Test
    void deleteLink_existingDeletes() {
        StudentGuardianId id = new StudentGuardianId(1L, 2L);
        when(studentGuardianRepository.existsById(id)).thenReturn(true);

        service.deleteLink(1L, 2L);

        verify(studentGuardianRepository).deleteById(id);
    }

    private Student buildStudent(Long id, String first, String last) {
        Student student = new Student();
        student.setFirstName(first);
        student.setLastName(last);
        ReflectionTestUtils.setField(student, "id", id);
        return student;
    }

    private Guardian buildGuardian(Long id, String first, String last) {
        Guardian guardian = new Guardian();
        guardian.setFirstName(first);
        guardian.setLastName(last);
        ReflectionTestUtils.setField(guardian, "id", id);
        return guardian;
    }
}
