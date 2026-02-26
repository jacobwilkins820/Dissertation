import { API_BASE_URL } from "../config/env";
import {
  extractErrorMessage,
  getAuthHeader,
  safeReadJson,
} from "../utils/utilFuncs";
import type {
  AcademicYearResponse,
  AttendanceRecordListItemResponse,
  AttendanceRecordResponse,
  AttendanceSessionResponse,
  ClassListItemResponse,
  ClassResponse,
  EmailParentsResponse,
  CreateGuardianUserRequest,
  CreateStudentRequest,
  CreateUserRequest,
  EnrolmentListItemResponse,
  GuardianDetail,
  GuardianDto,
  GuardianSearch,
  PageResponse,
  RoleDto,
  Student,
  StudentGuardianResponse,
  UserListItemResponse,
} from "../utils/responses";
import type {
  CreateAttendanceRecordRequest,
  CreateAttendanceSessionRequest,
  CreateClassRequest,
  CreateEnrolmentRequest,
  SaveAttendanceForSessionRequest,
  SendClassEmailRequest,
  StudentGuardianUpdateRequest,
  UpdateClassRequest,
  UpdateCurrentUserRequest,
  UpdateAttendanceRecordRequest,
  UpdateGuardianRequest,
  UpdateStudentRequest,
} from "../utils/requests";

// Error shape used by fetchJson when backend Gets non-2xx responses.
export type FetchJsonError = Error & { payload?: unknown };

// Accepts either absolute URLs or API-relative paths.
function buildUrl(path: string) {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

// Backend occasionally returns null for list endpoints; Clean up to []
function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// Type guard so callers can safely inspect backend validation payloads.
export function isFetchJsonError(err: unknown): err is FetchJsonError {
  return !!err && typeof err === "object" && "payload" in err;
}

export async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  // Attach auth header by default. Callers can still override/extend headers.
  const res = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...(options.headers ?? {}),
    },
    signal: signal ?? options.signal,
  });

  if (!res.ok) {
    // Clean up server error payloads into Error.message while preserving payload.
    const payload = await safeReadJson(res);
    const err = new Error(extractErrorMessage(payload)) as FetchJsonError;
    err.payload = payload;
    throw err;
  }

  return (await safeReadJson(res)) as T;
}

// Guardians
export async function searchGuardians<T extends GuardianSearch | GuardianDto>(
  query: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const data = await fetchJson<T[] | null>(
    `/api/guardians/search?query=${encodeURIComponent(query)}`,
    {},
    signal,
  );
  return ensureArray<T>(data);
}

// Students
export async function searchStudents<T>(
  query: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("page", "0");
  params.set("size", "10");

  const payload = await fetchJson<PageResponse<T> | null>(
    `/api/students?${params.toString()}`,
    {},
    signal,
  );
  return ensureArray<T>(payload?.content);
}

export async function getStudentsPage<T>(
  options: { query?: string; page: number; size: number; sort?: string },
  signal?: AbortSignal,
): Promise<PageResponse<T>> {
  const params = new URLSearchParams();
  if (options.query) params.set("q", options.query);
  params.set("page", String(options.page));
  params.set("size", String(options.size));
  if (options.sort) params.set("sort", options.sort);

  const payload = await fetchJson<PageResponse<T> | null>(
    `/api/students?${params.toString()}`,
    {},
    signal,
  );

  if (!payload || !Array.isArray(payload.content)) {
    // Guard against bad payloads before rendering paginated tables.
    throw new Error("Unexpected response from server.");
  }

  return payload;
}

export function getStudent(id: number, signal?: AbortSignal) {
  return fetchJson<Student>(`/api/students/${id}`, {}, signal);
}

export function getStudentGuardians(id: number, signal?: AbortSignal) {
  return fetchJson<StudentGuardianResponse[] | null>(
    `/api/students/${id}/guardians`,
    {},
    signal,
  ).then((data) => ensureArray<StudentGuardianResponse>(data));
}

export function updateStudent(id: number, payload: UpdateStudentRequest) {
  return fetchJson<Student>(`/api/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateStudentGuardianLink(
  studentId: number,
  guardianId: number,
  payload: StudentGuardianUpdateRequest,
) {
  return fetchJson<StudentGuardianResponse>(
    `/api/students/${studentId}/guardians/${guardianId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteStudentGuardianLink(
  studentId: number,
  guardianId: number,
): Promise<void> {
  await fetchJson<unknown>(
    `/api/students/${studentId}/guardians/${guardianId}`,
    {
      method: "DELETE",
    },
  );
}

// Guardians
export async function getGuardianDetail(
  id: number,
  options: { full: boolean },
  signal?: AbortSignal,
): Promise<GuardianDetail> {
  const endpoint = options.full
    ? `/api/guardians/${id}`
    : `/api/guardians/${id}/contact`;
  const data = await fetchJson<GuardianDetail | null>(endpoint, {}, signal);

  if (!data || typeof data !== "object") {
    throw new Error("Unexpected response from server.");
  }

  return data;
}

export async function getGuardianStudents(
  id: number,
  signal?: AbortSignal,
): Promise<StudentGuardianResponse[]> {
  const data = await fetchJson<StudentGuardianResponse[] | null>(
    `/api/guardians/${id}/students`,
    {},
    signal,
  );
  return ensureArray<StudentGuardianResponse>(data);
}

export async function updateGuardian(
  id: number,
  payload: UpdateGuardianRequest,
): Promise<void> {
  await fetchJson<unknown>(`/api/guardians/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Users and roles
export function updateCurrentUser(payload: UpdateCurrentUserRequest) {
  return fetchJson<UserListItemResponse>("/api/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getRoles(): Promise<RoleDto[]> {
  const data = await fetchJson<RoleDto[] | null>("/api/roles", {
    headers: { "Content-Type": "application/json" },
  });
  return ensureArray<RoleDto>(data);
}

export async function createUser(payload: CreateUserRequest): Promise<void> {
  await fetchJson<unknown>("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createGuardianUser(
  payload: CreateGuardianUserRequest,
): Promise<void> {
  await fetchJson<unknown>("/api/users/guardian-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createStudent(
  payload: CreateStudentRequest,
): Promise<void> {
  await fetchJson<unknown>("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Classes
export async function getClasses(
  signal?: AbortSignal,
): Promise<ClassListItemResponse[]> {
  const data = await fetchJson<ClassListItemResponse[] | null>(
    "/api/classes",
    {},
    signal,
  );
  return ensureArray<ClassListItemResponse>(data);
}

export function getClass(id: number, signal?: AbortSignal) {
  return fetchJson<ClassResponse>(`/api/classes/${id}`, {}, signal);
}

export async function getUsers(
  signal?: AbortSignal,
): Promise<UserListItemResponse[]> {
  const data = await fetchJson<UserListItemResponse[] | null>(
    "/api/users",
    {},
    signal,
  );
  return ensureArray<UserListItemResponse>(data);
}

export async function createClass(payload: CreateClassRequest): Promise<void> {
  await fetchJson<unknown>("/api/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateClass(id: number, payload: UpdateClassRequest) {
  return fetchJson<ClassResponse>(`/api/classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function sendClassEmailToParents(
  id: number,
  payload: SendClassEmailRequest,
): Promise<EmailParentsResponse> {
  return fetchJson<EmailParentsResponse>(`/api/classes/${id}/email-parents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Academic years and enrolments
export function getCurrentAcademicYear(signal?: AbortSignal) {
  return fetchJson<AcademicYearResponse>(
    "/api/academic-years/current",
    {},
    signal,
  );
}

export async function getClassEnrolments(
  classId: number,
  academicYearId: number,
  signal?: AbortSignal,
): Promise<EnrolmentListItemResponse[]> {
  const data = await fetchJson<EnrolmentListItemResponse[] | null>(
    `/api/enrolments/classes/${classId}/enrolments?academicYearId=${academicYearId}`,
    {},
    signal,
  );
  return ensureArray<EnrolmentListItemResponse>(data);
}

export async function getStudentEnrolments(
  studentId: number,
  academicYearId: number,
  signal?: AbortSignal,
): Promise<EnrolmentListItemResponse[]> {
  const data = await fetchJson<EnrolmentListItemResponse[] | null>(
    `/api/enrolments/students/${studentId}/enrolments?academicYearId=${academicYearId}`,
    {},
    signal,
  );
  return ensureArray<EnrolmentListItemResponse>(data);
}

export async function createEnrolment(
  payload: CreateEnrolmentRequest,
): Promise<void> {
  await fetchJson<unknown>("/api/enrolments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteEnrolment(id: number): Promise<void> {
  await fetchJson<unknown>(`/api/enrolments/${id}`, {
    method: "DELETE",
  });
}

// Attendance
export async function getAttendanceSessionsForClass(
  classId: number,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<AttendanceSessionResponse[]> {
  const params = new URLSearchParams({
    classId: String(classId),
    from,
    to,
  });
  const data = await fetchJson<AttendanceSessionResponse[] | null>(
    `/api/attendance-sessions?${params.toString()}`,
    {},
    signal,
  );
  return ensureArray<AttendanceSessionResponse>(data);
}

export async function getAttendanceRecordsForSession(
  sessionId: number,
  signal?: AbortSignal,
): Promise<AttendanceRecordListItemResponse[]> {
  const data = await fetchJson<AttendanceRecordListItemResponse[] | null>(
    `/api/attendance-sessions/${sessionId}/attendance-records`,
    {},
    signal,
  );
  return ensureArray<AttendanceRecordListItemResponse>(data);
}

export function getAttendanceRecord(
  id: number,
  signal?: AbortSignal,
): Promise<AttendanceRecordResponse> {
  return fetchJson<AttendanceRecordResponse>(
    `/api/attendance-records/${id}`,
    {},
    signal,
  );
}

export function createAttendanceSession(
  payload: CreateAttendanceSessionRequest,
): Promise<AttendanceSessionResponse> {
  return fetchJson<AttendanceSessionResponse>("/api/attendance-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAttendanceRecord(
  id: number,
  payload: UpdateAttendanceRecordRequest,
): Promise<AttendanceRecordResponse> {
  return fetchJson<AttendanceRecordResponse>(`/api/attendance-records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function createAttendanceRecord(
  payload: CreateAttendanceRecordRequest,
): Promise<AttendanceRecordResponse> {
  return fetchJson<AttendanceRecordResponse>("/api/attendance-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function saveAttendanceForSession(
  sessionId: number,
  payload: SaveAttendanceForSessionRequest,
): Promise<AttendanceRecordResponse[]> {
  return fetchJson<AttendanceRecordResponse[]>(
    `/api/attendance-sessions/${sessionId}/attendance-records`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
