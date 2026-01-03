import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/env";
import { Button } from "../components/Button";
import { SearchSelect } from "../components/SearchSelect";
import {
  extractErrorMessage,
  getAuthHeader,
  safeReadJson,
} from "../utils/utilFuncs";
import { useNavigate } from "react-router-dom";
import { hasPermission, Permissions } from "../utils/permissions";
import { useAuth } from "../auth/UseAuth";

type Student = {
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

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

const sortOptions = [
  { label: "Last name (A-Z)", value: "lastName,asc" },
  { label: "Last name (Z-A)", value: "lastName,desc" },
  { label: "First name (A-Z)", value: "firstName,asc" },
  { label: "First name (Z-A)", value: "firstName,desc" },
  { label: "Date of birth (newest)", value: "dateOfBirth,desc" },
  { label: "Date of birth (oldest)", value: "dateOfBirth,asc" },
  { label: "Status (A-Z)", value: "status,asc" },
];

const pageSizeOptions = [10, 25, 50, 100];

export default function StudentPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState(sortOptions[0].value);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [page, setPage] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canView = hasPermission(
    user?.permissionLevel ?? 0,
    Permissions.VIEW_STUDENT_DIRECTORY
  );

  const fetchStudentMatches = useCallback(
    async (query: string, signal: AbortSignal) => {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("page", "0");
      params.set("size", "10");

      const res = await fetch(
        `${API_BASE_URL}/api/students?${params.toString()}`,
        {
          headers: {
            ...getAuthHeader(),
          },
          signal,
        }
      );

      if (!res.ok) {
        const payload = await safeReadJson(res);
        throw new Error(extractErrorMessage(payload));
      }

      const payload = (await safeReadJson(res)) as PageResponse<Student> | null;
      if (!payload || !Array.isArray(payload.content)) {
        return [];
      }
      return payload.content;
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudents() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        params.set("page", String(page));
        params.set("size", String(pageSize));
        if (sortValue) params.set("sort", sortValue);

        const res = await fetch(
          `${API_BASE_URL}/api/students?${params.toString()}`,
          {
            headers: {
              ...getAuthHeader(),
            },
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const payload = await safeReadJson(res);
          throw new Error(extractErrorMessage(payload));
        }

        const payload = (await safeReadJson(
          res
        )) as PageResponse<Student> | null;
        if (!payload || !Array.isArray(payload.content)) {
          throw new Error("Unexpected response from server.");
        }

        setStudents(payload.content);
        setTotalElements(payload.totalElements ?? 0);
        setTotalPages(payload.totalPages ?? 0);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(
            err instanceof Error ? err.message : "Failed to load students."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadStudents();

    return () => controller.abort();
  }, [searchQuery, page, pageSize, sortValue]);

  const pageStart = totalElements === 0 ? 0 : page * pageSize + 1;
  const pageEnd = Math.min(totalElements, (page + 1) * pageSize);

  const statsLabel = useMemo(() => {
    if (loading) return "Loading students...";
    if (totalElements === 0) return "No students found.";
    return `Showing ${pageStart}-${pageEnd} of ${totalElements} students.`;
  }, [loading, pageEnd, pageStart, totalElements]);

  if (!canView) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        You do not have permission to access this page.
      </div>
    );
  }

  if (canView) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Directory
            </p>
            <h1 className="text-3xl font-semibold text-white">Students</h1>
            <p className="text-sm text-slate-300">
              Browse the student directory, refine results, and jump to key
              records.
            </p>
          </div>
        </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
          <div className="grid gap-4 md:grid-cols-[1.6fr_1fr_0.8fr]">
            <SearchSelect
              label="Search"
              placeholder="Search by name, UPN, status"
              selected={selectedStudent}
              onSelect={(student) => {
                if (student) {
                  setSelectedStudent(student);
                  navigate(`/student/${student.id}`);
                } else {
                  setSelectedStudent(null);
                }
              }}
              onQueryChange={setSearchInput}
              fetchOptions={fetchStudentMatches}
              getOptionKey={(student) => student.id}
              getOptionLabel={(student) =>
                `${student.firstName} ${student.lastName}${
                  student.upn ? ` · ${student.upn}` : ""
                }`
              }
              minChars={2}
              idleLabel="Type at least 2 characters."
              loadingLabel="Searching..."
              resultsLabel="Matches"
              emptyLabel="No matches."
              showSelectedSummary={false}
              showResults={false}
            />

            <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
              Sort by
              <select
                className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 transition focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
                value={sortValue}
                onChange={(e) => {
                  setSortValue(e.target.value);
                  setPage(0);
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
              Results
              <select
                className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 transition focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
            <div>{statsLabel}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={loading || page === 0}
              >
                Previous
              </Button>
              <span>
                Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages - 1))
                }
                disabled={loading || page + 1 >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-black/30">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-4 py-4">Student</th>
                <th className="px-4 py-4">UPN</th>
                <th className="px-4 py-4">Date of Birth</th>
                <th className="px-4 py-4">Gender</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="relative border-t border-slate-800/60 hover:bg-slate-900/50"
                >
                  <td className="px-4 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute inset-0 h-full w-full rounded-none px-0 py-0"
                      onClick={() => navigate(`/student/${student.id}`)}
                      aria-label={`Select ${student.firstName} ${student.lastName}`}
                    >
                      <span className="sr-only">
                        Select {student.firstName} {student.lastName}
                      </span>
                    </Button>

                    <div className="relative z-10 pointer-events-none">
                      <div className="font-medium text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        ID: {student.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-100 relative z-10 pointer-events-none">
                    {student.upn || "-"}
                  </td>
                  <td className="px-4 py-4 relative z-10 pointer-events-none">
                    {formatDate(student.dateOfBirth)}
                  </td>
                  <td className="px-4 py-4 relative z-10 pointer-events-none">
                    {student.gender || "-"}
                  </td>
                  <td className="px-4 py-4 relative z-10 pointer-events-none">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusClasses(student.status)}`}
                    >
                      {student.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="px-4 py-4 relative z-10 pointer-events-none">
                    {formatDateTime(student.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && students.length === 0 && !error && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No students match your filters.
            </div>
          )}

          {loading && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Loading students...
            </div>
          )}
        </div>
      </div>
    );
  }

  function formatDate(value?: string) {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  }

  function formatDateTime(value?: string) {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  }

  function statusClasses(status?: string) {
    switch (status) {
      case "ACTIVE":
        return "border-emerald-300/40 bg-emerald-400/10 text-emerald-200";
      case "INACTIVE":
        return "border-amber-300/40 bg-amber-400/10 text-amber-200";
      case "WITHDRAWN":
        return "border-rose-400/40 bg-rose-500/10 text-rose-200";
      default:
        return "border-slate-600/40 bg-slate-800/60 text-slate-300";
    }
  }
}
