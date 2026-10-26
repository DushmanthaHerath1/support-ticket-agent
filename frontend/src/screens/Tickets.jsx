import {
  TicketCheck,
  DollarSign,
  Smile,
  RefreshCw,
  Search,
  Filter,
  RotateCcw,
  AlertTriangle,
  Inbox,
  Eye,
  Calendar,
  User,
  Hash,
} from "lucide-react";

import { useTickets } from "../hooks/useTickets";
import { formatCurrency, formatDate } from "../utils/formatters";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";

function Tickets() {
  const {
    tickets,
    filteredTickets,
    isLoading,
    isRefreshing,
    error,
    metrics,
    loadTickets,
    searchQuery,
    setSearchQuery,
    sentimentFilter,
    setSentimentFilter,
    resolutionFilter,
    setResolutionFilter,
    resetFilters,
    selectedTicket,
    setSelectedTicket,
    closeDetailModal,
  } = useTickets();

  const isFiltered =
    searchQuery.trim() !== "" ||
    sentimentFilter !== "ALL" ||
    resolutionFilter !== "ALL";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Resolved Tickets
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Audit Log
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Structured outputs and sentiment analytics logged automatically by
            the AI agent.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Analytics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <StatCard
          title="Total Resolved Tickets"
          value={metrics.total}
          subtitle="Audit log entries"
          icon={TicketCheck}
          accent="blue"
        />
        <StatCard
          title="Total Refund Payouts"
          value={formatCurrency(metrics.totalRefunded)}
          subtitle="Processed through agent"
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          title="Customer Satisfaction"
          value={metrics.satisfactionRate}
          subtitle="Positive & neutral rating"
          icon={Smile}
          accent="amber"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, ID, category..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Sentiment Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">
              Sentiment:
            </span>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="NEGATIVE">Negative</option>
              <option value="FRUSTRATED">Frustrated</option>
            </select>
          </div>

          {/* Resolution Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">
              Resolution:
            </span>
            <select
              value={resolutionFilter}
              onChange={(e) => setResolutionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Resolutions</option>
              <option value="REFUND_ISSUED">Refund Issued</option>
              <option value="REFUND_REJECTED">Refund Rejected</option>
              <option value="ORDER_CANCELLED">Order Cancelled</option>
              <option value="INQUIRY_ANSWERED">Inquiry Answered</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          {/* Reset button (visible when filters are active) */}
          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-100 rounded-md w-1/4" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">
              Failed to load audit tickets
            </h4>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              onClick={loadTickets}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={isFiltered ? "No matching tickets" : "No resolved tickets yet"}
          description={
            isFiltered
              ? "No tickets match your current search and filter criteria."
              : "When the AI agent concludes customer inquiries, resolved tickets will appear here."
          }
          action={
            isFiltered ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset All Filters</span>
              </button>
            ) : null
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Customer & Thread</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Sentiment</th>
                  <th className="py-3.5 px-4">Resolution</th>
                  <th className="py-3.5 px-4">Refund Amount</th>
                  <th className="py-3.5 px-4">Resolved At</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Customer & Thread */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {ticket.customer_name || "Unknown Customer"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                        {ticket.conversation_id}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                        {String(ticket.category || "").replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Sentiment */}
                    <td className="py-3.5 px-4">
                      <Badge status={ticket.sentiment} />
                    </td>

                    {/* Resolution */}
                    <td className="py-3.5 px-4">
                      <Badge status={ticket.resolution} />
                    </td>

                    {/* Refund Amount */}
                    <td className="py-3.5 px-4 font-semibold">
                      {ticket.refund_amount ? (
                        <span className="text-emerald-600">
                          {formatCurrency(ticket.refund_amount)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Resolved At */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(ticket.resolved_at)}
                    </td>

                    {/* Action: Inspect Modal */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="View Ticket Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-medium text-[11px]">Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Result Count */}
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Showing {filteredTickets.length} of {tickets.length} ticket
              {tickets.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}

      {/* Ticket Inspect Detail Modal */}
      <Modal
        isOpen={Boolean(selectedTicket)}
        onClose={closeDetailModal}
        title="Ticket Audit Details"
        description={`Audit record for ticket #${selectedTicket?.id?.slice(0, 8)}`}
      >
        {selectedTicket && (
          <div className="space-y-4 text-xs">
            {/* Customer & Timestamp Bar */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Customer
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedTicket.customer_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Resolved At
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatDate(selectedTicket.resolved_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Structured Classification Badges */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Primary Category
                </span>
                <span className="font-semibold text-slate-800 uppercase tracking-wide">
                  {String(selectedTicket.category || "").replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Customer Sentiment
                </span>
                <Badge status={selectedTicket.sentiment} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Resolution Outcome
                </span>
                <Badge status={selectedTicket.resolution} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Refund Processed
                </span>
                <span className="font-bold text-emerald-600">
                  {selectedTicket.refund_amount
                    ? formatCurrency(selectedTicket.refund_amount)
                    : "No refund issued ($0.00)"}
                </span>
              </div>
            </div>

            {/* Conversation Ref */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                LangGraph Checkpointer Thread ID
              </span>
              <div className="p-2 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-700 break-all select-all">
                {selectedTicket.conversation_id}
              </div>
            </div>

            {/* Footer close button */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeDetailModal}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Tickets;
