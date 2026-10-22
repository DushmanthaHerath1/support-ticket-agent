import React from "react";
import {
  Clock,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Inbox,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { useApprovals } from "../hooks/useApprovals";
import { formatCurrency } from "../utils/formatters";
import ApprovalCard from "../components/ApprovalCard";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";

function Approvals() {
  const {
    approvals,
    isLoading,
    isRefreshing,
    error,
    processingId,
    totalPendingValue,
    loadApprovals,
    handleQuickApprove,
    // Edit modal
    editTarget,
    editAmount,
    editNotes,
    editError,
    isSubmittingEdit,
    setEditAmount,
    setEditNotes,
    handleOpenEdit,
    handleConfirmEdit,
    closeEditModal,
    // Reject modal
    rejectTarget,
    rejectNotes,
    rejectError,
    isSubmittingReject,
    setRejectNotes,
    handleOpenReject,
    handleConfirmReject,
    closeRejectModal,
  } = useApprovals();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Refund Approvals
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              HITL Dashboard
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review and authorize agent-initiated refunds paused at
            Human-In-The-Loop checkpoints.
          </p>
        </div>

        <button
          type="button"
          onClick={loadApprovals}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <StatCard
          title="Pending Requests"
          value={approvals.length}
          subtitle="Awaiting manager authorization"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Total Value Under Review"
          value={formatCurrency(totalPendingValue)}
          subtitle="Potential refund payout"
          icon={DollarSign}
          accent="emerald"
        />
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">
              Failed to load pending approvals
            </h4>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              onClick={loadApprovals}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="All caught up!"
          description="There are currently no refund requests waiting for manager authorization."
          action={
            <button
              type="button"
              onClick={loadApprovals}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Check for new requests</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={handleQuickApprove}
              onEdit={handleOpenEdit}
              onReject={handleOpenReject}
              isProcessing={processingId === approval.id}
            />
          ))}
        </div>
      )}

      {/* Modal 1: Edit Refund Amount */}
      <Modal
        isOpen={Boolean(editTarget)}
        onClose={closeEditModal}
        title="Adjust Refund Amount"
        description={`Order #${editTarget?.order_id} • Original Total: ${formatCurrency(
          editTarget?.order_amount || editTarget?.proposed_amount,
        )}`}
      >
        <form onSubmit={handleConfirmEdit} className="space-y-4">
          {editError && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Adjusted Amount (USD)
              </label>
              <span className="text-xs text-slate-400">
                Max:{" "}
                {formatCurrency(
                  editTarget?.order_amount || editTarget?.proposed_amount,
                )}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={Number(
                  editTarget?.order_amount || editTarget?.proposed_amount,
                )}
                disabled={isSubmittingEdit}
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-60"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Manager Justification Notes
              </label>
              <span className="text-xs text-slate-400">
                {editNotes.length}/300
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={300}
              disabled={isSubmittingEdit}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Explain reason for adjusting the amount..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none disabled:opacity-60"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmittingEdit}
              onClick={closeEditModal}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmittingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Approve</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Reject Confirmation */}
      <Modal
        isOpen={Boolean(rejectTarget)}
        onClose={closeRejectModal}
        title="Reject Refund Request"
        description={`Order #${rejectTarget?.order_id} • Requested: ${formatCurrency(
          rejectTarget?.proposed_amount,
        )}`}
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          {rejectError && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{rejectError}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rejection Reason for Customer
              </label>
              <span className="text-xs text-slate-400">
                {rejectNotes.length}/300
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={300}
              disabled={isSubmittingReject}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g., Item delivered over 30 days ago, warranty expired..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white resize-none disabled:opacity-60"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              This note will be provided to the AI agent to communicate politely
              with the customer.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmittingReject}
              onClick={closeRejectModal}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReject}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmittingReject ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Approvals;
