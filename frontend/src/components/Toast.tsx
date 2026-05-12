import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
  /** Auto-dismiss duration in ms. Set to 0 to disable auto-close. */
  duration?: number;
}

export default function Toast({
  type,
  message,
  onClose,
  duration = 5000,
}: ToastProps) {
  const isSuccess = type === "success";

  // Auto-close after `duration` ms
  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        role="alert"
        className={`relative flex items-start gap-3 px-5 py-4 rounded-xl border-2 shadow-2xl backdrop-blur-sm min-w-[320px] max-w-md overflow-hidden ${
          isSuccess
            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-100 shadow-emerald-500/20"
            : "bg-rose-500/15 border-rose-500/50 text-rose-100 shadow-rose-500/20"
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isSuccess ? "bg-emerald-500/30" : "bg-rose-500/30"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p
            className={`text-xs uppercase tracking-wider font-semibold mb-0.5 ${
              isSuccess ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {isSuccess ? "Επιτυχία" : "Σφάλμα"}
          </p>
          <p className="text-sm leading-relaxed font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Κλείσιμο"
          className="text-slate-300 hover:text-white transition-colors shrink-0 -mr-1 -mt-1 p-1 rounded hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress bar that drains over the duration */}
        {duration > 0 && (
          <div
            className={`absolute bottom-0 left-0 h-1 ${
              isSuccess ? "bg-emerald-400" : "bg-rose-400"
            }`}
            style={{
              animation: `toastShrink ${duration}ms linear forwards`,
            }}
          />
        )}
      </div>
    </div>
  );
}
