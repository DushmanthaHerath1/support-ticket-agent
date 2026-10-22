import { useState, useEffect, useCallback } from "react";
import { getPendingApprovals, actOnApproval } from "../assets/api/client";
import { toCents, roundCurrency } from "../utils/formatters";

export function useApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Edit Modal State
  const [editTarget, setEditTarget] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectError, setRejectError] = useState(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Manual fetch
  const loadApprovals = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await getPendingApprovals();
      setApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load pending approvals:", err);
      setError(
        "Unable to connect to the backend server. Please check if the API is running.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  // Core API dispatcher
  const handleAction = async (
    approvalId,
    action,
    finalAmount = null,
    notes = "",
  ) => {
    setProcessingId(approvalId);
    try {
      await actOnApproval(approvalId, {
        action,
        final_amount: finalAmount !== null ? roundCurrency(finalAmount) : null,
        notes:
          notes.slice(0, 300) ||
          (action === "approve"
            ? "Approved by manager"
            : "Rejected by manager"),
      });

      // Optimistically remove from list on success
      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      return true;
    } catch (err) {
      console.error(`Failed to ${action} approval:`, err);
      throw err;
    } finally {
      setProcessingId(null);
    }
  };

  // Quick 1-click Approve
  const handleQuickApprove = async (approvalId) => {
    try {
      await handleAction(approvalId, "approve");
    } catch (err) {
      alert(`Approval failed: ${err.message || "Unknown error occurred"}`);
    }
  };

  // Edit Handlers
  const handleOpenEdit = (approval) => {
    setEditTarget(approval);
    setEditAmount(approval.proposed_amount);
    setEditNotes("Approved with adjusted refund amount per manager review.");
    setEditError(null);
  };

  const handleConfirmEdit = async (e) => {
    e.preventDefault();
    if (!editTarget || isSubmittingEdit) return;

    setEditError(null);
    const sanitizedAmount = roundCurrency(editAmount);

    if (isNaN(sanitizedAmount) || sanitizedAmount <= 0) {
      setEditError("Please enter a valid positive dollar amount.");
      return;
    }

    const maxAllowed = Number(
      editTarget.order_amount || editTarget.proposed_amount,
    );
    if (sanitizedAmount > maxAllowed) {
      setEditError(`Refund cannot exceed the order total.`);
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await handleAction(editTarget.id, "approve", sanitizedAmount, editNotes);
      setEditTarget(null); // Close modal only on success
    } catch (err) {
      setEditError(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Reject Handlers
  const handleOpenReject = (approval) => {
    setRejectTarget(approval);
    setRejectNotes("");
    setRejectError(null);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget || isSubmittingReject) return;

    const notes = rejectNotes.trim();
    if (!notes) {
      setRejectError(
        "Please provide a rejection reason so the agent can inform the customer.",
      );
      return;
    }

    setIsSubmittingReject(true);
    setRejectError(null);
    try {
      await handleAction(rejectTarget.id, "reject", null, notes);
      setRejectTarget(null); // Close modal only on success
    } catch (err) {
      setRejectError(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Sum using integer cents to prevent IEEE float drift
  const totalCents = approvals.reduce(
    (sum, a) => sum + toCents(a.proposed_amount),
    0,
  );
  const totalPendingValue = totalCents / 100;

  return {
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
    closeEditModal: () => !isSubmittingEdit && setEditTarget(null),
    // Reject modal
    rejectTarget,
    rejectNotes,
    rejectError,
    isSubmittingReject,
    setRejectNotes,
    handleOpenReject,
    handleConfirmReject,
    closeRejectModal: () => !isSubmittingReject && setRejectTarget(null),
  };
}
