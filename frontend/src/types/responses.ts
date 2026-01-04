export type ClassListItemResponse = {
  id: number;
  name: string;
  code?: string | null;
  active: boolean;
};

export type ClassResponse = {
  id: number;
  teacherId?: number | null;
  teacherName?: string | null;
  name: string;
  code?: string | null;
  active: boolean;
};

export type UserListItemResponse = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  enabled?: boolean;
  roleName?: string | null;
};

export type AcademicYearResponse = {
  id: number;
  name: string;
  startsOn: string;
  endsOn: string;
};

export type EnrolmentListItemResponse = {
  id: number;
  studentId: number;
  classId: number;
  startDate: string;
  endDate?: string | null;
};

export type StudentResponse = {
  id: number;
  upn?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
};

export type SessionPart = "AM" | "PM";

export type AttendanceSessionResponse = {
  id: number;
  classId: number;
  academicYearId: number;
  academicYearName: string;
  sessionDate: string;
  session: SessionPart;
};

export type AttendanceRecordListItemResponse = {
  id: number;
  studentId: number;
  status: "PRESENT" | "ABSENT" | "LATE";
  markedAt?: string | null;
};

export type AttendanceRecordResponse = {
  id: number;
  attendanceSessionId: number;
  studentId: number;
  status: "PRESENT" | "ABSENT" | "LATE";
  reason?: string | null;
  markedAt?: string | null;
};

export type Student = {
  id: number;
  upn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};
