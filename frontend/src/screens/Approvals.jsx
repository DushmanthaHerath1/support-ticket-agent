import { useState, useEffect } from "react";
import { getPendingApprovals, actOnApproval } from "../assets/api/client";

function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadApprovals = async () => {
      try {
        const data = await getPendingApprovals();
        setApprovals(data);
      } catch (err) {
        setError("Failed to load approvals");
      } finally {
        setIsLoading(false);
      }
    };

    loadApprovals();
  }, []);

  const handleAction = async (
    approvalId,
    action,
    finalAmount = null,
    notes = "",
  ) => {
    await actOnApproval(approvalId, {
      action,
      final_amount: finalAmount,
      notes,
    });
    setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
  };

  //edge cases
  const renderContent = () => {
    if (isLoading) {
      return <p>Loading...</p>;
    }
    if (error) {
      return <p>{error}</p>;
    }
    if (approvals.length === 0) {
      return <p>No Pending approvals</p>;
    }
  };

  return (
    <div>
      <div>{renderContent()}</div>
    </div>
  );
}

export default Approvals;
