import React from "react";
import { Banknote, CreditCard, Clock } from "lucide-react";

interface CheckoutSummaryProps {
  numericNetValue: number;
  vatRate: number;
  vatAmount: number;
  grossValue: number;
  documentType: "invoice" | "retail";
  customerId: number | null;
  loading: boolean;
  handleCheckout: (paymentMethod: "CASH" | "POS" | "PENDING") => void;
}

export default function CheckoutSummary({
  numericNetValue,
  vatRate,
  vatAmount,
  grossValue,
  documentType,
  customerId,
  loading,
  handleCheckout,
}: CheckoutSummaryProps) {
  const isInvoice = documentType === "invoice";
  const disabledCheckout = loading || numericNetValue <= 0 || (isInvoice && !customerId);

  return (
    <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-sm sticky top-6">
      <h2 className="text-sm font-semibold text-slate-200 mb-6 pb-4 border-b border-slate-800">
        Σύνοψη
      </h2>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Καθαρή Αξία:</span>
          <span className="text-slate-200 font-mono">
            €{numericNetValue.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">ΦΠΑ ({vatRate}%):</span>
          <span className="text-slate-200 font-mono">
            €{vatAmount.toFixed(2)}
          </span>
        </div>
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-base font-medium text-slate-300">
            Τελικό Ποσό:
          </span>
          <span className="text-2xl font-semibold text-emerald-400 font-mono">
            €{grossValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Actions */}
      <div className="space-y-3">
        {isInvoice ? (
          // 3 Buttons for B2B
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleCheckout("CASH")}
              disabled={disabledCheckout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Banknote className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              Μετρητά
            </button>

            <button
              onClick={() => handleCheckout("PENDING")}
              disabled={disabledCheckout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              Εκκρεμές
            </button>

            <div className="col-span-2">
              <button
                onClick={() => handleCheckout("POS")}
                disabled={disabledCheckout}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-600 hover:bg-brand-500 border border-brand-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {loading ? "Επεξεργασία..." : "Πληρωμή POS"}
              </button>
            </div>
          </div>
        ) : (
          // 2 Buttons for B2C Retail
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleCheckout("CASH")}
              disabled={disabledCheckout}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Banknote className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              Μετρητά
            </button>

            <button
              onClick={() => handleCheckout("POS")}
              disabled={disabledCheckout}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-600 hover:bg-brand-500 border border-brand-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {loading ? "Επεξεργασία..." : "Πληρωμή POS"}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        Η πληρωμή POS απαιτεί διασύνδεση με το τερματικό.
      </p>
    </div>
  );
}
