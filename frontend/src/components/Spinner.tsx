import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <Loader2
      className={`animate-spin text-brand-400 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} />
        <p className="text-sm text-slate-500">Φόρτωση δεδομένων...</p>
      </div>
    </div>
  );
}

export function SendingOverlay({ message = "Επεξεργασία..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 bg-slate-900 border border-slate-800 px-8 py-6 rounded-2xl shadow-2xl">
        <Spinner size={40} className="text-brand-500" />
        <p className="text-sm font-medium text-slate-200 animate-pulse">{message}</p>
      </div>
    </div>
  );
}
