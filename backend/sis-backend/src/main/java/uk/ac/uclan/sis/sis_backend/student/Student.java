package uk.ac.uclan.sis.sis_backend.student;

import jakarta.persistence.*;

@Entity
public class Student {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String firstName;

  @Column(nullable = false)
  private String lastName;

  protected Student() {}

  public Student(String firstName, String lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  public Long getId() { return id; }
  public String getFirstName() { return firstName; }
  public String getLastName() { return lastName; }
}
