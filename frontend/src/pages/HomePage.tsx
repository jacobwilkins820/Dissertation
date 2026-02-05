// Blank landing page for authenticated users.
export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Home
        </p>
        <h1 className="text-3xl font-semibold text-white">Welcome</h1>
        <p className="text-sm text-slate-300">
          Select a section from the navigation to get started.
        </p>
      </div>
    </div>
  );
}
