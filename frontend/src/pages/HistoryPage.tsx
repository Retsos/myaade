import { useEffect, useRef, useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Filter,
  Wallet,
  Receipt,
  Coins,
} from "lucide-react";
import { getInvoices, payInvoicePOS } from "../api";
import { Spinner } from "../components/Spinner";
import Toast from "../components/Toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  SkeletonStatCard,
  SkeletonTableRow,
  SkeletonCard,
} from "../components/ui/Skeleton";

type InvoiceRecord = {
  id: number;
  customer_name: string;
  customer_vat?: string;
  invoice_type: string;
  series: string;
  aa: string;
  uid: string;
  issue_date: string;
  total_net_value?: number;
  total_vat_amount?: number;
  total_gross_value: number;
  mark: string;
  invoice_url: string;
  status?: string;
  payment_method?: string;
};

const B2B_TYPES = ["1.1", "2.1", "2.4", "5.1"];

function getStatusBadge(inv: InvoiceRecord) {
  const isB2B = B2B_TYPES.includes(inv.invoice_type);
  const isPending = inv.status === "PENDING" && isB2B;
  if (isPending) {
    return {
      label: "Εκκρεμές",
      icon: Clock,
      className:
        "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    };
  }
  return {
    label: "Εξοφλήθη",
    icon: CheckCircle,
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };
}

function isPendingB2B(inv: InvoiceRecord) {
  return inv.status === "PENDING" && B2B_TYPES.includes(inv.invoice_type);
}

type Totals = { net: number; vat: number; gross: number };

export default function HistoryPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [totals, setTotals] = useState<Totals>({ net: 0, vat: 0, gross: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [vat, setVat] = useState("");
  const [mark, setMark] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFiltersCount = [vat, mark, from, to].filter(
    (v) => v && v.trim() !== "",
  ).length;
  const limit = 10;

  const [invoiceToPay, setInvoiceToPay] = useState<InvoiceRecord | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [payTouched, setPayTouched] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Real-time validation of the POS payment amount. Returns null when valid.
  const payValidation = (() => {
    if (!invoiceToPay) return null;
    if (payAmount.trim() === "") return "Συμπληρώστε το ποσό χρέωσης.";
    if (!/^\d+(\.\d{1,2})?$/.test(payAmount.trim()))
      return "Μη έγκυρος αριθμός. Χρησιμοποίησε π.χ. 12.50";
    const n = parseFloat(payAmount);
    if (n <= 0) return "Το ποσό πρέπει να είναι μεγαλύτερο από 0.";
    if (n < invoiceToPay.total_gross_value)
      return `Το ποσό υπολείπεται. Ελάχιστο: €${invoiceToPay.total_gross_value.toFixed(2)}`;
    return null;
  })();

  // Tip = anything paid above the invoice total. Shown as a positive hint.
  const tipPreview = (() => {
    if (!invoiceToPay || payValidation) return 0;
    const n = parseFloat(payAmount);
    return Math.max(
      0,
      parseFloat((n - invoiceToPay.total_gross_value).toFixed(2)),
    );
  })();

  const fetchData = (params: {
    vat?: string;
    mark?: string;
    from?: string;
    to?: string;
    page?: number;
  }) => {
    setLoading(true);
    return getInvoices({
      vat: params.vat || undefined,
      mark: params.mark || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      page: params.page || 1,
      limit,
    })
      .then((res) => {
        if (res.success) {
          setInvoices(res.invoices || []);
          setTotals(res.totals || { net: 0, vat: 0, gross: 0 });
          setTotal(res.total || 0);
          setTotalPages(res.totalPages || 1);
          setPage(res.page || 1);
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 1200);
        }
      })
      .catch(() => console.error("Δεν βρέθηκαν παραστατικά"))
      .finally(() => setLoading(false));
  };

  // Initial fetch
  useEffect(() => {
    fetchData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-apply filters with debounce
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      fetchData({ vat, mark, from, to, page: 1 });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vat, mark, from, to]);

  const clearFilters = () => {
    setVat("");
    setMark("");
    setFrom("");
    setTo("");
  };
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchData({ vat, mark, from, to, page: p });
  };

  const handlePayment = async () => {
    if (!invoiceToPay) return;
    setPayTouched(true);
    if (payValidation) {
      setPayError(payValidation);
      return;
    }

    setPayError("");
    setPaying(true);
    try {
      const result = await payInvoicePOS(
        invoiceToPay.id,
        parseFloat(payAmount),
      );
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceToPay.id ? result.invoice : inv)),
      );
      const seriesRef = `${invoiceToPay.series}-${invoiceToPay.aa}`;
      setInvoiceToPay(null);
      setPayAmount("");
      setPayTouched(false);
      setToast({
        type: "success",
        message: `Το παραστατικό ${seriesRef} εξοφλήθηκε επιτυχώς μέσω POS.`,
      });
    } catch (err: any) {
      console.error("Payment failed:", err);
      setPayError(
        err.error || err.details || "Αποτυχία επικοινωνίας με το POS.",
      );
    } finally {
      setPaying(false);
    }
  };

  const isInitialLoading = loading && invoices.length === 0;

  return (
    <div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <div className="mb-6 flex flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-400" /> Ιστορικό Παραστατικών
          </h1>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2 min-h-[20px]">
            {loading ? (
              <>
                <Spinner size={14} />
                <span>Αναζήτηση...</span>
              </>
            ) : justUpdated ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 animate-in fade-in duration-200">
                <CheckCircle className="w-3.5 h-3.5" />
                {total} καταχωρήσεις
              </span>
            ) : (
              <span>{total} καταχωρήσεις στην επιλεγμένη περίοδο.</span>
            )}
          </div>
        </div>
        {/* Mobile filter trigger */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFiltersOpen(true)}
          iconLeft={<Filter className="w-4 h-4" />}
          className="sm:hidden shrink-0 relative"
        >
          Φίλτρα
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filters — desktop only */}
      <div className="hidden sm:block bg-slate-850 border border-slate-800 rounded-xl p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Φίλτρα Αναζήτησης
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Καθαρισμός ({activeFiltersCount})
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label="ΑΦΜ Πελάτη"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            placeholder="π.χ. 026883248"
          />
          <Input
            label="MARK"
            value={mark}
            onChange={(e) => setMark(e.target.value)}
            placeholder="π.χ. 400001..."
            className="font-mono"
          />
          <Input
            label="Ημερομηνία Από"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="Ημερομηνία Έως"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Totals */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Καθαρή Αξία
              </p>
              <p className="text-lg font-semibold font-mono text-slate-100 truncate">
                €{totals.net.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Συνολικό ΦΠΑ
              </p>
              <p className="text-lg font-semibold font-mono text-slate-100 truncate">
                €{totals.vat.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-slate-850 border border-brand-500/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-brand-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-brand-300/70 font-medium">
                Σύνολο Περιόδου
              </p>
              <p className="text-lg font-semibold font-mono text-brand-300 truncate">
                €{totals.gross.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`bg-slate-850 border border-slate-800 rounded-xl overflow-hidden transition-opacity duration-200 ${
          loading && !isInitialLoading ? "opacity-60" : ""
        }`}
      >
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                <th className="p-4">Παραστατικο</th>
                <th className="p-4">Ημερομηνια</th>
                <th className="p-4">Πελατης</th>
                <th className="p-4">ΑΦΜ</th>
                <th className="p-4 text-right">Καθαρή</th>
                <th className="p-4 text-right">ΦΠΑ</th>
                <th className="p-4 text-right">Σύνολο</th>
                <th className="p-4 text-center">Κατάσταση</th>
                <th className="p-4 text-center">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={9} />
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Δεν βρέθηκαν αποτελέσματα.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const status = getStatusBadge(inv);
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="p-4 font-mono text-slate-300">
                        <span>
                          {inv.invoice_type} | {inv.series}-{inv.aa}
                        </span>
                        <div className="text-[10px] text-slate-600 mt-1">
                          MARK: {inv.mark || "-"}
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">
                        {inv.issue_date
                          ? new Date(inv.issue_date).toLocaleDateString(
                              "el-GR",
                            )
                          : "-"}
                      </td>
                      <td className="p-4 truncate max-w-[200px] text-slate-300">
                        {inv.customer_name || "-"}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">
                        {inv.customer_vat || "-"}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        €{(inv.total_net_value || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        €{(inv.total_vat_amount || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono font-medium text-brand-300">
                        €{(inv.total_gross_value || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {isPendingB2B(inv) && (
                            <button
                              type="button"
                              onClick={() => setInvoiceToPay(inv)}
                              title="Εξόφληση με POS"
                              className="inline-flex p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-800">
          {isInitialLoading ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Δεν βρέθηκαν αποτελέσματα.
            </div>
          ) : (
            invoices.map((inv) => {
              const status = getStatusBadge(inv);
              const StatusIcon = status.icon;
              return (
                <div key={inv.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-slate-200">
                        {inv.invoice_type} | {inv.series}-{inv.aa}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate">
                        MARK: {inv.mark || "-"}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${status.className}`}
                    >
                      <StatusIcon className="w-3 h-3" /> {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs mb-3">
                    <div>
                      <p className="text-slate-500">Πελάτης</p>
                      <p className="text-slate-200 truncate">
                        {inv.customer_name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">ΑΦΜ</p>
                      <p className="text-slate-300 font-mono truncate">
                        {inv.customer_vat || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Ημερομηνία</p>
                      <p className="text-slate-300">
                        {inv.issue_date
                          ? new Date(inv.issue_date).toLocaleDateString(
                              "el-GR",
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Καθαρή</p>
                      <p className="text-slate-300 font-mono">
                        €{(inv.total_net_value || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">ΦΠΑ</p>
                      <p className="text-slate-300 font-mono">
                        €{(inv.total_vat_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Σύνολο</p>
                      <p className="text-brand-300 font-mono font-semibold">
                        €{(inv.total_gross_value || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {(inv.invoice_url || isPendingB2B(inv)) && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800/60">
                      {isPendingB2B(inv) && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setInvoiceToPay(inv)}
                          iconLeft={<CreditCard className="w-3.5 h-3.5" />}
                        >
                          POS
                        </Button>
                      )}
                      {inv.invoice_url && (
                        <a
                          href={inv.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-300 bg-brand-500/10 rounded-lg hover:bg-brand-500/20 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> PDF
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
            <span className="text-xs text-slate-500">
              Σελίδα {page} από {totalPages} • {total} συνολικά
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                iconLeft={<ChevronLeft className="w-4 h-4" />}
              >
                Προηγ.
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                iconRight={<ChevronRight className="w-4 h-4" />}
              >
                Επόμ.
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filters Modal */}
      {filtersOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-slate-700 bg-slate-850 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="sticky top-0 bg-slate-850 flex items-center justify-between border-b border-slate-800 px-5 py-4 z-10">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  Φίλτρα Αναζήτησης
                </h2>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                    {activeFiltersCount} ενεργά
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="text-slate-500 transition-colors hover:text-slate-300"
                aria-label="Κλείσιμο"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <Input
                label="ΑΦΜ Πελάτη"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                placeholder="π.χ. 026883248"
              />
              <Input
                label="MARK"
                value={mark}
                onChange={(e) => setMark(e.target.value)}
                placeholder="π.χ. 400001..."
                className="font-mono"
              />
              <Input
                label="Ημερομηνία Από"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <Input
                label="Ημερομηνία Έως"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="sticky bottom-0 bg-slate-850 flex flex-col gap-2 border-t border-slate-800 px-5 py-4">
              <Button
                fullWidth
                onClick={() => setFiltersOpen(false)}
                iconLeft={<Search className="w-4 h-4" />}
              >
                Εφαρμογή
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  clearFilters();
                  setFiltersOpen(false);
                }}
                iconLeft={<RotateCcw className="w-4 h-4" />}
              >
                Καθαρισμός
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <Input
                label="Ποσό χρέωσης στο POS (€)"
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => {
                  setPayAmount(e.target.value);
                  setPayTouched(true);
                  if (payError) setPayError("");
                }}
                placeholder={`π.χ. ${invoiceToPay.total_gross_value.toFixed(2)}`}
                error={
                  payError ||
                  (payTouched && payValidation ? payValidation : undefined)
                }
                hint={
                  !payValidation && tipPreview > 0
                    ? `Συμπεριλαμβάνεται φιλοδώρημα €${tipPreview.toFixed(2)}`
                    : undefined
                }
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setInvoiceToPay(null);
                  setPayAmount("");
                  setPayError("");
                  setPayTouched(false);
                }}
                disabled={paying}
              >
                Ακύρωση
              </Button>
              <Button
                variant="success"
                onClick={handlePayment}
                disabled={paying || !!payValidation}
                loading={paying}
                className="min-w-[140px]"
              >
                {paying ? "Επικοινωνία..." : "Χρέωση Κάρτας"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
