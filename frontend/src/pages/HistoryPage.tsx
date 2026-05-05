import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  ExternalLink,
  Search,
  XCircle,
  AlertTriangle,
  X,
  CreditCard,
} from "lucide-react";
import { getInvoices, cancelInvoice, payInvoicePOS } from "../api";
import { PageLoader, Spinner } from "../components/Spinner";

type InvoiceRecord = {
  id: number;
  customer_name: string;
  invoice_type: string;
  series: string;
  aa: string;
  uid: string;
  issue_date: string;
  total_gross_value: number;
  mark: string;
  invoice_url: string;
  status?: string; // 'PAID' | 'PENDING' | 'cancelled'
  payment_method?: string;
};

export default function HistoryPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [invoiceToCancel, setInvoiceToCancel] = useState<InvoiceRecord | null>(
    null,
  );
  const [cancelling, setCancelling] = useState(false);

  const [invoiceToPay, setInvoiceToPay] = useState<InvoiceRecord | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    getInvoices()
      .then((res) => {
        // Handle both old array format and new {success, invoices} format seamlessly
        if (res.success && res.invoices) {
          setInvoices(res.invoices);
        } else if (Array.isArray(res)) {
          setInvoices(res);
        }
      })
      .catch(() => console.error("Δεν βρέθηκαν παραστατικά"))
      .finally(() => setLoading(false));
  }, []);

  const confirmCancel = async () => {
    if (!invoiceToCancel || invoiceToCancel.status === "cancelled") return;

    setCancelling(true);
    try {
      const cancelledInvoice = await cancelInvoice(invoiceToCancel.id);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceToCancel.id ? cancelledInvoice : inv,
        ),
      );
      setInvoiceToCancel(null);
    } finally {
      setCancelling(false);
    }
  };

  const handlePayment = async () => {
    if (!invoiceToPay || !payAmount) return;

    const parsedAmount = parseFloat(payAmount);
    if (parsedAmount < invoiceToPay.total_gross_value) {
      setPayError(`Το ποσό υπολείπεται. Ελάχιστο ποσό: €${invoiceToPay.total_gross_value.toFixed(2)}`);
      return;
    }

    setPayError("");
    setPaying(true);
    try {
      // Ένα χτύπημα και τέλος. Το backend μιλάει με όλους.
      const result = await payInvoicePOS(invoiceToPay.id, parseFloat(payAmount));

      // Ενημερώνουμε την οθόνη του χρήστη τοπικά για να πρασινίσει
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceToPay.id ? result.invoice : inv
      ));
      
      setInvoiceToPay(null);
      setPayAmount("");
      
      console.log(`Το χρέος σβήστηκε. Sign: ${result.signature?.substring(0, 15) || ""}...`);

    } catch (err: any) {
      console.error("Αποτυχία πληρωμής:", err);
      setPayError(err.error || "Αποτυχία επικοινωνίας με το POS.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <PageLoader />;

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      (inv.customer_name || "").toLowerCase().includes(q) ||
      (inv.mark || "").toLowerCase().includes(q) ||
      (inv.series || "").toLowerCase().includes(q) ||
      (inv.aa || "").toLowerCase().includes(q)
    );
  });

  const cancelIdentifier = invoiceToCancel
    ? invoiceToCancel.mark || `${invoiceToCancel.series}-${invoiceToCancel.aa}`
    : "";

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-400" /> Ιστορικό
            Παραστατικών
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ο καθρέφτης της δουλειάς σου. {invoices.length} καταχωρήσεις.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Αναζήτηση..."
            className="pl-9 pr-4 py-2 bg-slate-850 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                <th className="p-4">Παραστατικο</th>
                <th className="p-4">Ημερομηνια</th>
                <th className="p-4">Πελατης</th>
                <th className="p-4 text-right">Ποσο</th>
                <th className="p-4 text-center">Κατασταση</th>
                <th className="p-4 text-center">Ενεργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {search
                      ? "Δεν βρέθηκαν αποτελέσματα για την αναζήτηση σας."
                      : "Δεν υπάρχουν εκδομένα παραστατικά. Το τεφτέρι είναι άδειο."}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const isCancelled = inv.status === "cancelled";
                  const rowClass = isCancelled
                    ? "opacity-60 bg-slate-900/20"
                    : "hover:bg-slate-800/20";

                  return (
                    <tr
                      key={inv.id}
                      className={`${rowClass} transition-colors`}
                    >
                      <td className="p-4 font-mono text-slate-300">
                        <span
                          className={
                            isCancelled ? "line-through text-slate-500" : ""
                          }
                        >
                          {inv.invoice_type} | {inv.series}-{inv.aa}
                        </span>
                        <div className="text-[10px] text-slate-600 mt-1">
                          MARK: {inv.mark || "-"}
                        </div>
                      </td>
                      <td
                        className={`p-4 ${isCancelled ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {inv.issue_date
                          ? new Date(inv.issue_date).toLocaleDateString("el-GR")
                          : "-"}
                      </td>
                      <td
                        className={`p-4 truncate max-w-[200px] ${isCancelled ? "text-slate-500" : "text-slate-300"}`}
                      >
                        {inv.customer_name || "-"}
                      </td>
                      <td
                        className={`p-4 text-right font-mono font-medium ${isCancelled ? "text-slate-500" : "text-brand-300"}`}
                      >
                        €{(inv.total_gross_value || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Ακυρωμένο
                          </span>
                        ) : inv.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" /> Εξοφλήθη
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" /> Εκκρεμεί
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* 1. Κουμπί Προβολής (PDF) */}
                          {inv.invoice_url ? (
                            <a
                              href={inv.invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-2 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                              title="Προβολή PDF"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="inline-flex p-2 text-slate-700">
                              <ExternalLink className="w-4 h-4" />
                            </span>
                          )}

                          {/* 2. ΝΕΟ ΚΟΥΜΠΙ: Εξόφληση με POS (Εμφανίζεται ΜΟΝΟ στα PENDING) */}
                          {inv.status === "PENDING" && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => setInvoiceToPay(inv)}
                              title="Εξόφληση με POS"
                              className="inline-flex p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* 3. Κουμπί Ακύρωσης */}
                          <button
                            type="button"
                            onClick={() => setInvoiceToCancel(inv)}
                            disabled={isCancelled || inv.status === "PAID"} // Δεν ακυρώνεις κάτι που έχει πληρωθεί
                            title={
                              isCancelled
                                ? "Ήδη ακυρωμένο"
                                : inv.status === "PAID"
                                  ? "Αδύνατη η ακύρωση (Εξοφλημένο)"
                                  : "Ακύρωση"
                            }
                            className="inline-flex p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:text-slate-700 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {invoiceToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-850 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Ακύρωση παραστατικού
                  </h2>
                  <p className="text-xs text-slate-500">
                    Η εγγραφή θα μαρκαριστεί ως ακυρωμένη.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceToCancel(null)}
                disabled={cancelling}
                className="text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-sm text-slate-300">
                Θέλεις σίγουρα να ακυρώσεις το παραστατικό{" "}
                <span className="font-mono text-slate-100">
                  {cancelIdentifier}
                </span>
                ;
              </p>
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Προς το παρόν γίνεται μόνο local ακύρωση. Το provider call θα
                μπει όταν συνδεθούν τα endpoints ακύρωσης.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
              <button
                type="button"
                onClick={() => setInvoiceToCancel(null)}
                disabled={cancelling}
                className="px-4 py-2 text-sm text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-50"
              >
                Άκυρο
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-60"
              >
                {cancelling ? (
                  <>
                    <Spinner size={16} className="text-white" /> Ακύρωση...
                  </>
                ) : (
                  "Επιβεβαίωση"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ΠΛΗΡΩΜΗΣ */}
      {invoiceToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-850 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Εξόφληση Παραστατικού
                  </h2>
                  <p className="text-xs text-slate-500">Έκδοση Sign μέσω POS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInvoiceToPay(null);
                  setPayAmount("");
                }}
                disabled={paying}
                className="text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <p className="text-sm text-slate-300">
                Παραστατικό:{" "}
                <span className="font-mono text-slate-100">
                  {invoiceToPay.series}-{invoiceToPay.aa}
                </span>
                <br />
                Πελάτης:{" "}
                <span className="text-slate-100">
                  {invoiceToPay.customer_name}
                </span>
                <br />
                Συνολικό Υπόλοιπο:{" "}
                <span className="font-mono text-brand-300">
                  €{invoiceToPay.total_gross_value.toFixed(2)}
                </span>
              </p>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                  Ποσό χρέωσης στο POS (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    if (payError) setPayError("");
                  }}
                  placeholder="π.χ. 50.00"
                  className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-sm text-slate-200 focus:outline-none transition-colors ${payError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-brand-500'}`}
                />
                {payError && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {payError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setInvoiceToPay(null);
                  setPayAmount("");
                  setPayError("");
                }}
                disabled={paying}
                className="px-4 py-2 text-sm text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-50"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handlePayment}
                disabled={paying || !payAmount}
                className="flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
              >
                {paying ? (
                  <>
                    <Spinner size={16} className="text-white" /> Επικοινωνία...
                  </>
                ) : (
                  "Χρέωση Κάρτας"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
