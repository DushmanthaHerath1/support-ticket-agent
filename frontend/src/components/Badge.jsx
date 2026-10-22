import React from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  HelpCircle,
  Tag,
} from "lucide-react";

const VARIANTS = {
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
  neutral: "bg-slate-50 text-slate-600 ring-slate-500/20",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
};

const STATUS_MAP = {
  PENDING: { variant: "warning", label: "Pending Review", icon: Clock },
  APPROVED: { variant: "success", label: "Approved", icon: CheckCircle2 },
  REJECTED: { variant: "danger", label: "Rejected", icon: XCircle },
  CANCELLED: { variant: "neutral", label: "Cancelled", icon: AlertCircle },
  DELIVERED: { variant: "success", label: "Delivered", icon: CheckCircle2 },
  SHIPPED: { variant: "info", label: "Shipped", icon: Tag },

  POSITIVE: { variant: "success", label: "Positive", icon: Smile },
  NEUTRAL: { variant: "neutral", label: "Neutral", icon: Meh },
  NEGATIVE: { variant: "danger", label: "Negative", icon: Frown },
  FRUSTRATED: { variant: "danger", label: "Frustrated", icon: Frown },

  REFUND_ISSUED: {
    variant: "success",
    label: "Refund Issued",
    icon: CheckCircle2,
  },
  REFUND_REJECTED: {
    variant: "danger",
    label: "Refund Rejected",
    icon: XCircle,
  },
  ORDER_CANCELLED: {
    variant: "neutral",
    label: "Order Cancelled",
    icon: AlertCircle,
  },
  INQUIRY_ANSWERED: {
    variant: "info",
    label: "Inquiry Answered",
    icon: CheckCircle2,
  },
  ESCALATED: { variant: "warning", label: "Escalated", icon: AlertCircle },
};

export default function Badge({
  status,
  variant = "neutral",
  label,
  icon: CustomIcon,
  showIcon = true,
  pulse = false,
  children,
  className = "",
}) {
  const mapped = status ? STATUS_MAP[status.toUpperCase()] : null;
  const activeVariant = mapped ? mapped.variant : variant;
  const displayText = label || children || mapped?.label || status || "";
  const IconComponent = CustomIcon || (showIcon && mapped ? mapped.icon : null);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
        VARIANTS[activeVariant] || VARIANTS.neutral
      } ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}

      {IconComponent && !pulse && (
        <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}

      <span>{displayText}</span>
    </span>
  );
}
