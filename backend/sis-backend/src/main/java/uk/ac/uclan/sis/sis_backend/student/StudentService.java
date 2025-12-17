package uk.ac.uclan.sis.sis_backend.student;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import uk.ac.uclan.sis.sis_backend.student.dto.CreateStudentRequest;
import uk.ac.uclan.sis.sis_backend.student.dto.StudentResponse;

import java.util.List;

@Service
public class StudentService {

  private final StudentRepository repo;

  public StudentService(StudentRepository repo) {
    this.repo = repo;
  }

  @Transactional
  public StudentResponse create(CreateStudentRequest req) {
      Student s = new Student(req.getFirstName().trim(), req.getLastName().trim());
      Student saved = repo.save(s);
      return StudentMapper.toResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<StudentResponse> list() {
      return repo.findAll()
          .stream()
          .map(StudentMapper::toResponse)
          .toList();
  }

  @Transactional(readOnly = true)
  public StudentResponse getById(Long id) {
      Student s = repo.findById(id)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
      return StudentMapper.toResponse(s);
  }

  @Transactional
  public void delete(Long id) {
    if (!repo.existsById(id)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    repo.deleteById(id);
  }

}