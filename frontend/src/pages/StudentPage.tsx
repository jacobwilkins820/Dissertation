// Student profile placeholder page.
export default function StudentPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Student Detail
        </p>
        <h1 className="text-3xl font-semibold text-white">Profile</h1>
        <p className="text-sm text-slate-300">
          Select a student from the directory to view records and history.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-2xl shadow-black/30">
        Student detail content will appear here once it is wired to the API.
      </div>
    </div>
  );
}
