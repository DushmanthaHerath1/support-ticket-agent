import React from "react";
import {
  Package,
  Clock,
  Bot,
  CheckCircle2,
  XCircle,
  Edit3,
  Loader2,
} from "lucide-react";
import Badge from "./Badge";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function ApprovalCard({
  approval,
  onApprove,
  onEdit,
  onReject,
  isProcessing = false,
}) {
  const {
    id,
    order_id,
    item_name,
    proposed_amount,
    reason,
    created_at,
    conversation_id,
  } = approval;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between">
      <div>
        {/* Card Header: Order Tag & Status & Date */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold tracking-wide">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              {order_id}
            </span>
            <Badge status="PENDING" pulse />
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(created_at)}</span>
          </div>
        </div>

        {/* Item & Proposed Dollar Amount */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Purchased Item
            </span>
            <h4 className="text-base font-semibold text-slate-900 mt-0.5">
              {item_name || "Order Item"}
            </h4>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Proposed Refund
            </span>
            <div className="flex items-center justify-end text-xl font-bold text-emerald-600 mt-0.5">
              <span>{formatCurrency(proposed_amount)}</span>
            </div>
          </div>
        </div>

        {/* Agent Justification Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
            <Bot className="w-3.5 h-3.5 text-indigo-500" />
            <span>Agent Justification</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed italic">
            "
            {reason ||
              "Refund requested by customer and validated against policy."}
            "
          </p>
        </div>

        {/* Conversation Reference Tag */}
        <div className="mt-3 text-[11px] text-slate-400 font-mono truncate">
          Thread: {conversation_id}
        </div>
      </div>

      {/* Action Buttons Group */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Reject Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onReject(approval)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-4 h-4" />
          <span>Reject</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Edit Amount Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onEdit(approval)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>Edit Amount</span>
          </button>

          {/* Quick Approve Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onApprove(id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
}
