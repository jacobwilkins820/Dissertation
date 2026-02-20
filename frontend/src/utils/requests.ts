// Request DTOs for backend mutations.
// should stay aligned with server endpoints so UI forms can serialize safely.
export type UpdateStudentRequest = {
  upn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status: string;
};

export type UpdateGuardianRequest = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
};

export type UpdateCurrentUserRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type StudentGuardianUpdateRequest = {
  relationship: string;
  isPrimary: boolean;
};

// Class management payloads.
export type CreateClassRequest = {
  name: string;
  code?: string;
  active: boolean;
  teacherId?: number;
};

export type UpdateClassRequest = {
  name?: string;
  code?: string | null;
  active?: boolean;
  teacherId?: number | null;
};

export type SendClassEmailRequest = {
  subject: string;
  message: string;
};

// Enrolment payloads.
export type CreateEnrolmentRequest = {
  studentId: number;
  classId: number;
  academicYearId: number;
  startDate: string;
  endDate?: string | null;
};

export type CreateAttendanceSessionRequest = {
  classId: number;
  sessionDate: string;
  session: "AM" | "PM";
};

// Attendance mutation payloads.
export type UpdateAttendanceRecordRequest = {
  status: "PRESENT" | "ABSENT" | "LATE";
  reason?: string | null;
};

export type CreateAttendanceRecordRequest = {
  attendanceSessionId: number;
  studentId: number;
  status: "PRESENT" | "ABSENT" | "LATE";
  reason?: string | null;
};

export type SaveAttendanceForSessionRequest = {
  records: Array<{
    studentId: number;
    status: "PRESENT" | "ABSENT" | "LATE";
    reason?: string | null;
  }>;
};
