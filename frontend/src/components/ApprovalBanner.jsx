import { Clock } from "lucide-react";

export default function ApprovalBanner({
  title = "Refund Request Under Review",
  description = "Your refund request has been submitted for supervisor review. Once approved, the funds will be processed automatically and confirmed here in this chat.",
}) {
  return (
    <div className="my-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-2xs animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3.5">
        {/* Animated pulse badge */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
          <Clock className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-amber-950">{title}</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
              Processing
            </span>
          </div>

          <p className="mt-1 text-xs text-amber-900/80 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
