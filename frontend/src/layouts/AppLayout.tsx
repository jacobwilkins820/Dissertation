import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function AppLayout() {
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ fontFamily: '"Fraunces", "Times New Roman", serif' }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_rgba(2,6,23,0.95))]" />
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative">
          <Navbar />
          <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
            <Outlet />
          </main>
        </div>
      </div>
      <div id="modal-root" className="relative z-[100]" />
    </div>
  );
}
