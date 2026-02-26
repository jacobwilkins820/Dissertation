import { useMemo, useState } from "react";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { CsvTemplateDownload } from "../../components/studentImport/CsvTemplateDownload";
import { useAuth } from "../../auth/UseAuth";
import { createStudent } from "../../services/backend";
import type { CreateStudentRequest } from "../../utils/responses";
import { getErrorMessage } from "../../utils/utilFuncs";
import { hasPermission, Permissions } from "../../utils/permissions";

type ParsedRow = {
  rowNumber: number;
  payload: CreateStudentRequest;
};

type RowIssue = {
  rowNumber: number;
  message: string;
};

type ImportResult = {
  rowNumber: number;
  upn: string;
  ok: boolean;
  message: string;
};

// Required template columns for creating a valid student payload.
const REQUIRED_COLUMNS = [
  "upn",
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
] as const;
const ALLOWED_STATUSES = new Set(["ACTIVE", "INACTIVE", "WITHDRAWN"]);

// Header normalization allows flexible CSV headers like "First Name" or "first_name".
function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

function canonicalColumnName(value: string): keyof CreateStudentRequest | null {
  const normalized = normalizeHeader(value);
  if (normalized === "upn") return "upn";
  if (normalized === "firstname") return "firstName";
  if (normalized === "lastname") return "lastName";
  if (normalized === "dateofbirth" || normalized === "dob")
    return "dateOfBirth";
  if (normalized === "gender") return "gender";
  if (normalized === "status") return "status";
  return null;
}

// Lightweight CSV parser that Handles quoted values
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

// Strict ISO-date validator for YYYY-MM-DD
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

// Spreadsheets may prefix date values with apostrophes; strip that safely.
function normalizeDateValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("'")) {
    return trimmed.slice(1).trim();
  }
  return trimmed;
}

// Accepts either ISO or DD-MM-YYYY and Turns to ISO. as excel messed with it sometimes when testing.
function toIsoDate(value: string): string | null {
  const normalized = normalizeDateValue(value);
  if (!normalized) return null;

  if (isIsoDate(normalized)) {
    return normalized;
  }

  const dmyMatch = normalized.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!dmyMatch) {
    return null;
  }

  const [, dd, mm, yyyy] = dmyMatch;
  const iso = `${yyyy}-${mm}-${dd}`;
  return isIsoDate(iso) ? iso : null;
}

// Parses CSV text into valid rows + per-row issues for preview/import feedback.
function buildRows(rawText: string): {
  rows: ParsedRow[];
  issues: RowIssue[];
  totalDataRows: number;
} {
  const parsed = parseCsv(rawText).filter((r) =>
    r.some((c) => c.trim().length > 0),
  );
  if (parsed.length === 0) {
    return {
      rows: [],
      issues: [{ rowNumber: 0, message: "CSV is empty." }],
      totalDataRows: 0,
    };
  }

  const headerRow = parsed[0];
  const headers = headerRow.map(canonicalColumnName);
  const provided = new Set(
    headers.filter((h): h is keyof CreateStudentRequest => h !== null),
  );

  const missing = REQUIRED_COLUMNS.filter((c) => !provided.has(c));
  if (missing.length > 0) {
    return {
      rows: [],
      issues: [
        {
          rowNumber: 0,
          message: `Missing required column(s): ${missing.join(", ")}.`,
        },
      ],
      totalDataRows: Math.max(parsed.length - 1, 0),
    };
  }

  const rows: ParsedRow[] = [];
  const issues: RowIssue[] = [];

  for (let i = 1; i < parsed.length; i += 1) {
    const csvRow = parsed[i];
    const rowNumber = i + 1;
    const record: Partial<CreateStudentRequest> = {};

    for (let col = 0; col < headers.length; col += 1) {
      const key = headers[col];
      if (!key) continue;
      record[key] = (csvRow[col] ?? "").trim();
    }

    const upn = (record.upn ?? "").trim();
    const firstName = (record.firstName ?? "").trim();
    const lastName = (record.lastName ?? "").trim();
    const rawDateOfBirth = normalizeDateValue(record.dateOfBirth ?? "");
    const dateOfBirth = toIsoDate(rawDateOfBirth);
    const gender = (record.gender ?? "").trim();
    const statusRaw = (record.status ?? "").trim();
    const status = statusRaw ? statusRaw.toUpperCase() : undefined;

    if (!upn || !firstName || !lastName || !rawDateOfBirth || !gender) {
      issues.push({
        rowNumber,
        message: "Missing required value(s).",
      });
      continue;
    }

    if (!dateOfBirth) {
      issues.push({
        rowNumber,
        message: "dateOfBirth must be YYYY-MM-DD or DD-MM-YYYY.",
      });
      continue;
    }

    if (status && !ALLOWED_STATUSES.has(status)) {
      issues.push({
        rowNumber,
        message: "status must be ACTIVE, INACTIVE, or WITHDRAWN.",
      });
      continue;
    }

    rows.push({
      rowNumber,
      payload: { upn, firstName, lastName, dateOfBirth, gender, status },
    });
  }

  return { rows, issues, totalDataRows: Math.max(parsed.length - 1, 0) };
}

// Bulk student import page with client-side CSV validation and row result error reporting.
export default function ImportStudentsPage() {
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canCreateStudent = hasPermission(
    permissionLevel,
    Permissions.CREATE_STUDENT,
  );

  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [totalDataRows, setTotalDataRows] = useState(0);
  const [busy, setBusy] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResult[]>([]);

  const summary = useMemo(() => {
    const success = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    return { success, failed };
  }, [results]);

  async function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setGlobalError(null);
    setResults([]);
    setRows([]);
    setIssues([]);
    setTotalDataRows(0);

    if (!file) {
      setFileName("");
      return;
    }

    setFileName(file.name);

    try {
      // Parse immediately so users can review valid/skipped rows
      const text = await file.text();
      const parsed = buildRows(text);
      setRows(parsed.rows);
      setIssues(parsed.issues);
      setTotalDataRows(parsed.totalDataRows);
    } catch (err: unknown) {
      setGlobalError(getErrorMessage(err, "Failed to read file."));
    }
  }

  async function onImport() {
    setBusy(true);
    setGlobalError(null);
    setResults([]);

    const out: ImportResult[] = [];
    // sequential: easier to map API errors directly to row order.
    for (const row of rows) {
      try {
        await createStudent(row.payload);
        out.push({
          rowNumber: row.rowNumber,
          upn: row.payload.upn,
          ok: true,
          message: "Created",
        });
      } catch (err: unknown) {
        out.push({
          rowNumber: row.rowNumber,
          upn: row.payload.upn,
          ok: false,
          message: getErrorMessage(err, "Failed to create student."),
        });
      }
    }

    setResults(out);
    setBusy(false);
  }

  if (!canCreateStudent) {
    return (
      <AlertBanner variant="error">
        You do not have permission to access this page.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Onboarding"
        title="Import Students (CSV)"
        subtitle="Upload a CSV and create student records in bulk."
      />

      <CsvTemplateDownload />

      {globalError && (
        <AlertBanner variant="error">
          <strong>Error:</strong> {globalError}
        </AlertBanner>
      )}

      <SectionCard padding="md" className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
            CSV format
          </p>
          <p className="text-sm text-slate-300">
            Required columns:{" "}
            <code>upn, firstName, lastName, dateOfBirth, gender</code>.
            Optional: <code>status</code>. Date format can be{" "}
            <code>YYYY-MM-DD</code> or <code>DD-MM-YYYY</code>.
          </p>
          <p className="text-xs text-slate-400">
            Example header:{" "}
            <code>upn,firstName,lastName,dateOfBirth,gender,status</code>
          </p>
        </div>

        <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
          Upload file
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onSelectFile}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-full file:border-0 file:bg-amber-300/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:uppercase file:tracking-[0.16em] file:text-amber-100"
          />
        </label>

        <div className="text-xs text-slate-400">
          {fileName ? `Selected: ${fileName}` : "No file selected."}
        </div>

        <div className="text-sm text-slate-300">
          Parsed rows: {rows.length} valid of {totalDataRows} data row(s).
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={onImport}
            disabled={busy || rows.length === 0}
          >
            {busy ? "Importing..." : "Import valid rows"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setFileName("");
              setRows([]);
              setIssues([]);
              setResults([]);
              setTotalDataRows(0);
              setGlobalError(null);
            }}
          >
            Reset
          </Button>
        </div>
      </SectionCard>

      {issues.length > 0 && (
        <SectionCard padding="md" className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
            Skipped Rows
          </p>
          <div className="max-h-56 overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
            <ul className="space-y-2 text-sm text-slate-200">
              {issues.map((issue) => (
                <li key={`${issue.rowNumber}-${issue.message}`}>
                  Row {issue.rowNumber}: {issue.message}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      )}

      {results.length > 0 && (
        <SectionCard padding="md" className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
            Import Results
          </p>
          <AlertBanner variant={summary.failed === 0 ? "success" : "info"}>
            Successful: {summary.success} | Failed: {summary.failed}
          </AlertBanner>
          <div className="max-h-64 overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
            <ul className="space-y-2 text-sm text-slate-200">
              {results.map((result) => (
                <li
                  key={`${result.rowNumber}-${result.upn}`}
                  className={result.ok ? "text-emerald-200" : "text-rose-200"}
                >
                  Row {result.rowNumber} ({result.upn}): {result.message}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
