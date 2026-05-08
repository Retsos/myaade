import { Banknote, CreditCard, Clock } from "lucide-react";
import Button from "../ui/Button";

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
  const disabledCheckout =
    loading || numericNetValue <= 0 || (isInvoice && !customerId);

  return (
    <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-sm sticky top-6">
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

      <div className="space-y-3">
        {isInvoice ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleCheckout("CASH")}
              disabled={disabledCheckout}
              iconLeft={<Banknote className="w-4 h-4 text-emerald-400" />}
            >
              Μετρητά
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleCheckout("PENDING")}
              disabled={disabledCheckout}
              iconLeft={<Clock className="w-4 h-4 text-amber-400" />}
            >
              Εκκρεμές
            </Button>
            <div className="col-span-2">
              <Button
                size="lg"
                fullWidth
                onClick={() => handleCheckout("POS")}
                disabled={disabledCheckout}
                loading={loading}
                iconLeft={!loading && <CreditCard className="w-5 h-5" />}
                className="shadow-lg shadow-brand-500/20"
              >
                {loading ? "Επεξεργασία..." : "Πληρωμή POS"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => handleCheckout("CASH")}
              disabled={disabledCheckout}
              iconLeft={<Banknote className="w-5 h-5 text-emerald-400" />}
            >
              Μετρητά
            </Button>
            <Button
              size="lg"
              fullWidth
              onClick={() => handleCheckout("POS")}
              disabled={disabledCheckout}
              loading={loading}
              iconLeft={!loading && <CreditCard className="w-5 h-5" />}
              className="shadow-lg shadow-brand-500/20"
            >
              {loading ? "Επεξεργασία..." : "Πληρωμή POS"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        Η πληρωμή POS απαιτεί διασύνδεση με το τερματικό.
      </p>
    </div>
  );
}
