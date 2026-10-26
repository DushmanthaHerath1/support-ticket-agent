import React from "react";
import {
  Loader2,
  Search,
  ShieldCheck,
  TicketCheck,
  Wrench,
} from "lucide-react";

// Human-friendly mapping for agent tool names
const TOOL_LABELS = {
  lookup_order: {
    label: "Looking up order records...",
    icon: Search,
  },
  check_refund_eligibility: {
    label: "Checking refund policy & eligibility...",
    icon: ShieldCheck,
  },
  issue_refund: {
    label: "Preparing refund request for manager review...",
    icon: ShieldCheck,
  },
  resolve_ticket: {
    label: "Logging resolution into audit system...",
    icon: TicketCheck,
  },
};

export default function StatusIndicator({ toolName }) {
  if (!toolName) return null;

  const toolConfig = TOOL_LABELS[toolName] || {
    label: `Running ${toolName.replace(/_/g, " ")}...`,
    icon: Wrench,
  };

  const Icon = toolConfig.icon;

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 my-2 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-700 text-xs font-medium w-fit animate-in fade-in slide-in-from-bottom-1 duration-200 shadow-2xs">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
      <Icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
      <span>{toolConfig.label}</span>
    </div>
  );
}
