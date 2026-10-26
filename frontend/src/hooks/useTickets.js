import { useState, useEffect, useCallback, useMemo } from "react";
import { getTickets } from "../assets/api/client";
import { toCents } from "../utils/formatters";

export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [resolutionFilter, setResolutionFilter] = useState("ALL");

  // Selected ticket for inspect detail modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Fetch tickets from backend API
  const loadTickets = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await getTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError(
        "Unable to connect to the backend server. Please check if the API is running.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Client-side filtered tickets with safe string coercion
  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tickets.filter((ticket) => {
      // Coerce to string safely + normalize underscores so "order inquiry" matches "ORDER_INQUIRY"
      const categoryStr = String(ticket.category ?? "")
        .replace(/_/g, " ")
        .toLowerCase();
      const resolutionStr = String(ticket.resolution ?? "")
        .replace(/_/g, " ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        String(ticket.customer_name ?? "")
          .toLowerCase()
          .includes(query) ||
        String(ticket.id ?? "")
          .toLowerCase()
          .includes(query) ||
        String(ticket.conversation_id ?? "")
          .toLowerCase()
          .includes(query) ||
        categoryStr.includes(query) ||
        resolutionStr.includes(query);

      // Sentiment filter matching
      const matchesSentiment =
        sentimentFilter === "ALL" ||
        String(ticket.sentiment ?? "").toUpperCase() ===
          sentimentFilter.toUpperCase();

      // Resolution filter matching
      const matchesResolution =
        resolutionFilter === "ALL" ||
        String(ticket.resolution ?? "").toUpperCase() ===
          resolutionFilter.toUpperCase();

      return matchesSearch && matchesSentiment && matchesResolution;
    });
  }, [tickets, searchQuery, sentimentFilter, resolutionFilter]);

  const metrics = useMemo(() => {
    const total = tickets.length;

    if (total === 0) {
      return { total: 0, totalRefunded: 0, satisfactionRate: "N/A" };
    }

    const refundCents = tickets.reduce((sum, t) => {
      const amount = Number(t.refund_amount);
      return sum + (!isNaN(amount) && amount > 0 ? toCents(amount) : 0);
    }, 0);

    const positiveOrNeutral = tickets.filter((t) =>
      ["POSITIVE", "NEUTRAL"].includes(String(t.sentiment ?? "").toUpperCase()),
    ).length;

    const satisfactionPercent = Math.round((positiveOrNeutral / total) * 100);

    return {
      total,
      totalRefunded: refundCents / 100,
      satisfactionRate: `${satisfactionPercent}%`,
    };
  }, [tickets]);

  // Stable callback references to prevent child re-renders
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSentimentFilter("ALL");
    setResolutionFilter("ALL");
  }, []);

  const closeDetailModal = useCallback(() => {
    setSelectedTicket(null);
  }, []);

  return {
    tickets,
    filteredTickets,
    isLoading,
    isRefreshing,
    error,
    metrics,
    loadTickets,
    // Filter controls
    searchQuery,
    setSearchQuery,
    sentimentFilter,
    setSentimentFilter,
    resolutionFilter,
    setResolutionFilter,
    resetFilters,
    // Inspect modal
    selectedTicket,
    setSelectedTicket,
    closeDetailModal,
  };
}
