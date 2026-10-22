// Currency formatter
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

//Safely formats any number or numeric string into USD currency
export function formatCurrency(amount, fallback = "$0.00") {
  if (amount === null || amount === undefined || amount === "") {
    return fallback;
  }
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  return currencyFormatter.format(numeric);
}

//Date formatter ISO to human readable
export function formatDate(dateString, fallback = "Just now") {
  if (!dateString) return fallback;
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return fallback;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fallback;
  }
}

/**
 * Returns a short relative time string (e.g., "Just now", "5m ago", "2h ago", "3d ago").
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  } catch {
    return "Just now";
  }
}

export function toCents(amount) {
  return Math.round((Number(amount) || 0) * 100);
}

export function roundCurrency(amount) {
  return toCents(amount) / 100;
}
