import { Button } from "../ui/Button";
import { SectionCard } from "../ui/SectionCard";

// Starter CSV schema and sample rows shown to users during student import.
const TEMPLATE_HEADERS = [
  "upn",
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "status",
];

const TEMPLATE_ROWS = [
  ["UPN1000000001", "Ada", "Lovelace", "e.g '01-01-2008'", "Female", "ACTIVE"],
  [
    "UPN1000000002",
    "Grace",
    "Hopper",
    "e.g '09-12-2009'",
    "Female",
    "INACTIVE",
  ],
];

// Escapes CSV cells containing commas, quotes, or newlines.
function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Builds downloadable CSV text from static template headers + sample rows.
function createTemplateCsv(): string {
  const lines = [
    TEMPLATE_HEADERS.map(csvEscape).join(","),
    ...TEMPLATE_ROWS.map((row) => row.map(csvEscape).join(",")),
  ];
  return lines.join("\n");
}

// Download action for the student import CSV template.
export function CsvTemplateDownload() {
  const downloadTemplate = () => {
    // Use a Blob URL to generate a client-side file without server involvement.
    const content = createTemplateCsv();
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-import-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionCard padding="md" className="grid gap-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
        Template
      </p>
      <p className="text-sm text-slate-300">
        Download a ready-made CSV template with valid column names and sample
        rows.
      </p>
      <div>
        <Button type="button" variant="secondary" onClick={downloadTemplate}>
          Download template
        </Button>
      </div>
    </SectionCard>
  );
}
