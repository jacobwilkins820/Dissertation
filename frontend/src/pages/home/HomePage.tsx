// Blank landing page for authenticated users.
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { TextField } from "../../components/ui/TextField";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Home"
        title="Welcome"
        subtitle="Select a button from the nav bar to get started."
      />

      <SectionCard className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
            Mock Newsletter
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Weekly School Newsletter
          </h2>
          <p className="max-w-xl text-sm text-slate-300">
            Get one short update each Friday with upcoming events and parent
            engagement highlights.
          </p>
          <form className="flex flex-col gap-3 sm:flex-row">
            <TextField
              type="email"
              placeholder="you@school.org"
              aria-label="Email address"
              className="sm:max-w-sm"
            />
            <Button type="submit" className="sm:w-auto">
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-slate-500">
            Mock component for homepage layout preview only.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Latest Issue
          </p>
          <h3 className="text-base font-semibold text-slate-100">
            March 2026: Attendance up 4.8%
          </h3>
          <p className="text-sm text-slate-300">
            Spotlight on year 3 punctuality gains, family workshop dates, and
            this month's staff recognition notes.
          </p>
          <button
            type="button"
            className="text-xs uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200"
          >
            Read sample edition
          </button>
        </div>
      </SectionCard>

      <SectionCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Previous Weeks
            </p>
            <h3 className="text-xl font-semibold text-white">
              Recent Newsletter Archive
            </h3>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ArchiveItem
            weekLabel="Week of 23 February 2026"
            headline="Year 2 Museum Trip Highlights"
            summary="Photo recap from the local history museum visit and student reflections from the day."
            linkLabel="Open recap"
          />
          <ArchiveItem
            weekLabel="Week of 16 February 2026"
            headline="New Spring Lunch Menu"
            summary="Preview of updated canteen options, allergy notes, and student feedback."
            linkLabel="View menu update"
          />
          <ArchiveItem
            weekLabel="Week of 9 February 2026"
            headline="Science Fair Project Showcase"
            summary="Top student projects, judging schedule, and details for parent visiting hours."
            linkLabel="Read highlights"
          />
          <ArchiveItem
            weekLabel="Week of 2 February 2026"
            headline="Sports Fixtures and Activity Clubs"
            summary="Upcoming football and netball fixtures plus new after-school arts club sign-ups."
            linkLabel="See activities"
          />
        </div>
      </SectionCard>
    </div>
  );
}

type ArchiveItemProps = {
  weekLabel: string;
  headline: string;
  summary: string;
  linkLabel: string;
};

function ArchiveItem({
  weekLabel,
  headline,
  summary,
  linkLabel,
}: ArchiveItemProps) {
  return (
    <article className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {weekLabel}
      </p>
      <h4 className="text-base font-semibold text-slate-100">{headline}</h4>
      <p className="text-sm text-slate-300">{summary}</p>
      <a
        href="#"
        className="inline-flex text-xs uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200"
      >
        {linkLabel}
      </a>
    </article>
  );
}
