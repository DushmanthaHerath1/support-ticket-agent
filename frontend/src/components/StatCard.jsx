import React from "react";

const ACCENTS = {
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  blue: {
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-100",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
  },
  slate: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-100",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "blue",
  className = "",
}) {
  const theme = ACCENTS[accent] || ACCENTS.blue;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && (
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-xl ${theme.bg} ${theme.text} ${theme.border} border`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h4 className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </h4>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400 font-normal">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
