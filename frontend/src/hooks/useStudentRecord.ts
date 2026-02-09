import { useCallback, useEffect, useState } from "react";
import type { Student } from "../utils/responses";
import { getStudent, updateStudent } from "../services/backend";
import { getErrorMessage } from "../utils/utilFuncs";

export type StudentForm = {
  upn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status: string;
};

const emptyForm: StudentForm = {
  upn: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  status: "ACTIVE",
};

export function useStudentRecord(
  studentId: number,
  canEditStudent: boolean,
  accessAllowed: boolean | null,
  isGuardianUser: boolean
) {
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [savingStudent, setSavingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const [formValues, setFormValues] = useState<StudentForm>(emptyForm);

  const loadStudent = useCallback(async (id: number, signal?: AbortSignal) => {
    return getStudent(id, signal);
  }, []);

  useEffect(() => {
    if (!Number.isFinite(studentId)) {
      setStudentError("Invalid student id.");
      return;
    }

    if (isGuardianUser && accessAllowed !== true) {
      setStudent(null);
      setStudentLoading(false);
      return;
    }

    const controller = new AbortController();
    setStudentLoading(true);
    setStudentError(null);

    loadStudent(studentId, controller.signal)
      .then((data) => {
        setStudent(data);
        setFormValues({
          upn: data.upn ?? "",
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          dateOfBirth: data.dateOfBirth ?? "",
          gender: data.gender ?? "",
          status: data.status ?? "ACTIVE",
        });
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setStudentError(getErrorMessage(err, "Failed to load student."));
        }
      })
      .finally(() => setStudentLoading(false));

    return () => controller.abort();
  }, [accessAllowed, isGuardianUser, loadStudent, studentId]);

  const resetForm = useCallback(() => {
    if (!student) return;
    setFormValues({
      upn: student.upn ?? "",
      firstName: student.firstName ?? "",
      lastName: student.lastName ?? "",
      dateOfBirth: student.dateOfBirth ?? "",
      gender: student.gender ?? "",
      status: student.status ?? "ACTIVE",
    });
  }, [student]);

  const handleStudentSave = useCallback(async () => {
    if (!student || !canEditStudent) return;

    setSavingStudent(true);
    setStudentError(null);

    try {
      const payload = {
        upn: formValues.upn.trim(),
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        dateOfBirth: formValues.dateOfBirth,
        gender: formValues.gender.trim(),
        status: formValues.status,
      };

      await updateStudent(student.id, payload);

      const refreshed = await loadStudent(student.id);
      setStudent(refreshed);
      setEditingStudent(false);
    } catch (err: unknown) {
      setStudentError(getErrorMessage(err, "Failed to update student."));
    } finally {
      setSavingStudent(false);
    }
  }, [canEditStudent, formValues, loadStudent, student]);

  return {
    student,
    studentLoading,
    studentError,
    savingStudent,
    editingStudent,
    formValues,
    setFormValues,
    setEditingStudent,
    setStudentError,
    resetForm,
    handleStudentSave,
  };
}
