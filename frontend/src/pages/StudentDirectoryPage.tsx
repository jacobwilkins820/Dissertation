import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { SearchSelect } from "../components/SearchSelect";
import { SelectDropdown } from "../components/SelectDropdown";
import { useNavigate } from "react-router-dom";
import { hasPermission, Permissions } from "../utils/permissions";
import { useAuth } from "../auth/UseAuth";
import type { Student } from "../utils/responses";
import { getStudentsPage, searchStudents } from "../services/backend";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { AlertBanner } from "../components/AlertBanner";
import { StateMessage } from "../components/StateMessage";
import { StatusBadge } from "../components/StatusBadge";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatDate, formatDateTime } from "../utils/date";

// Student directory with search, filters, and pagination.
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

export default function StudentDirectoryPage() {
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebouncedValue(searchInput.trim(), 300);
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
      return searchStudents<Student>(query, signal);
    },
    []
  );

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudents() {
      setLoading(true);
      setError(null);

      try {
        const payload = await getStudentsPage<Student>(
          {
            query: searchQuery || undefined,
            page,
            size: pageSize,
            sort: sortValue || undefined,
          },
          controller.signal
        );

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
        <PageHeader
          label="Directory"
          title="Students"
          subtitle="Browse the student directory, refine results, and jump to key records."
        />

        <SectionCard padding="md">
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

            <label className=" grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
              Sort by
              <SelectDropdown
                value={sortValue}
                options={sortOptions}
                onChange={(value) => {
                  setSortValue(value);
                  setPage(0);
                }}
                className="w-full"
              />
            </label>

            <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
              Results
              <SelectDropdown
                value={String(pageSize)}
                options={pageSizeOptions.map((size) => ({
                  value: String(size),
                  label: `${size} per page`,
                }))}
                onChange={(value) => {
                  setPageSize(Number(value));
                  setPage(0);
                }}
                className="w-full"
              />
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
        </SectionCard>

        {error && (
          <AlertBanner variant="error">{error}</AlertBanner>
        )}

        <SectionCard padding="none" className="overflow-x-auto">
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
                    <StatusBadge value={student.status} />
                  </td>
                  <td className="px-4 py-4 relative z-10 pointer-events-none">
                    {formatDateTime(student.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && students.length === 0 && !error && (
            <StateMessage>No students match your filters.</StateMessage>
          )}

          {loading && (
            <StateMessage>Loading students...</StateMessage>
          )}
        </SectionCard>
      </div>
    );
  }
}
