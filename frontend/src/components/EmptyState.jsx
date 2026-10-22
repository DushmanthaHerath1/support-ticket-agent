import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function EmptyState({
  icon: Icon = CheckCircle2,
  title = "No items found",
  description = "There are currently no items to display.",
  action = null,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 ${className}`}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-xs border border-slate-200 text-slate-400 mb-4">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold text-slate-900">{title}</h3>

      <p className="mt-1.5 text-sm text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
