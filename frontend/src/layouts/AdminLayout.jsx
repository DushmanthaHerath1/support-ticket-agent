import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { ShieldCheck, TicketCheck, ArrowLeft } from "lucide-react";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-tight">
                Support Agent
              </span>
              <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                Management Portal
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <NavLink
              to="approvals"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`
              }
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Approvals</span>
            </NavLink>

            <NavLink
              to="tickets"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                }`
              }
            >
              <TicketCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tickets Audit</span>
            </NavLink>
          </nav>

          {/* Quick link back to customer chat */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Back to Chat</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
