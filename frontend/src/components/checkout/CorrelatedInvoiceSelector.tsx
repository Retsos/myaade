// Searchable picker for the original invoice that a credit note (5.1) refers to.
//
// Shows a dropdown of past B2B invoices (excluding credit notes themselves and
// cancelled ones), filtered as the user types. Selecting a row exposes the full
// invoice object to the parent via `onSelect` so the parent can also lock the
// customer field and pre-fill the amount.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, AlertCircle, X, Search, FileText } from "lucide-react";
import { getInvoices } from "../../api";

const B2B_TYPES = ["1.1", "2.1", "2.4"]; // exclude 5.1 itself

interface InvoiceLite {
  id: number;
  customer_name: string;
  customer_vat?: string;
  invoice_type: string;
  series: string;
  aa: string;
  issue_date: string;
  total_net_value?: number;
  total_gross_value: number;
  mark: string;
  status?: string;
}

interface Props {
  selectedMark: string | null;
  selectedInvoice: InvoiceLite | null;
  onSelect: (invoice: InvoiceLite | null) => void;
  /** When set, the dropdown shows ONLY invoices issued to this VAT. */
  customerVat?: string | null;
}

export default function CorrelatedInvoiceSelector({
  selectedMark,
  selectedInvoice,
  onSelect,
  customerVat,
}: Props) {
  const [allInvoices, setAllInvoices] = useState<InvoiceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch the full invoice list once. Backend accepts limit=0 = no pagination.
  useEffect(() => {
    getInvoices({ limit: 0 })
      .then((res) => {
        const list: InvoiceLite[] =
          res?.success && Array.isArray(res.invoices) ? res.invoices : [];
        setAllInvoices(list);
      })
      .catch(() => setError("Αποτυχία φόρτωσης ιστορικού."))
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter: only B2B (non-credit, non-cancelled) with a MARK; if a customer
  // is already chosen upstream, restrict to invoices issued to that VAT;
  // finally apply the live search query.
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const vatFilter = customerVat?.trim();
    return allInvoices.filter((inv) => {
      if (!inv.mark) return false;
      if (!B2B_TYPES.includes(inv.invoice_type)) return false;
      if (inv.status === "cancelled") return false;
      if (vatFilter && inv.customer_vat !== vatFilter) return false;
      if (!q) return true;
      const haystack = [
        inv.mark,
        inv.series,
        inv.aa,
        inv.customer_name,
        inv.customer_vat,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [allInvoices, search, customerVat]);

  return (
    <div className="bg-rose-500/5 border border-rose-500/30 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-300 flex items-center justify-center shrink-0">
          <Link2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-100">
            Συσχετιζόμενο Παραστατικό (Πιστωτικό)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Επίλεξε το αρχικό τιμολόγιο που διορθώνει αυτό το πιστωτικό. Το MARK
            του θα σταλεί στην ΑΑΔΕ ως <code className="font-mono">correlatedInvoices</code>.
          </p>
        </div>
      </div>

      {/* Selected row OR search input */}
      {selectedInvoice ? (
        <div className="bg-slate-900 border border-rose-500/30 rounded-lg p-3 flex items-start gap-3">
          <FileText className="w-4 h-4 text-rose-300 mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-mono text-slate-200">
              {selectedInvoice.invoice_type} | {selectedInvoice.series}-
              {selectedInvoice.aa}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {selectedInvoice.customer_name}
              {selectedInvoice.customer_vat
                ? ` · ΑΦΜ ${selectedInvoice.customer_vat}`
                : ""}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              MARK: {selectedInvoice.mark} · €
              {(selectedInvoice.total_gross_value || 0).toFixed(2)} ·{" "}
              {selectedInvoice.issue_date}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setSearch("");
            }}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
            aria-label="Αφαίρεση επιλογής"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              loading
                ? "Φόρτωση παραστατικών..."
                : "Αναζήτηση με MARK / σειρά / ΑΦΜ / πελάτη..."
            }
            disabled={loading}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-colors"
          />

          {open && !loading && (
            <div className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl">
              {candidates.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  {customerVat
                    ? "Ο επιλεγμένος πελάτης δεν έχει συμβατά τιμολόγια."
                    : "Δεν βρέθηκαν συμβατά παραστατικά."}
                </div>
              ) : (
                candidates.slice(0, 50).map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => {
                      onSelect(inv);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-800/70 border-b border-slate-800 last:border-0 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm text-slate-200">
                        {inv.invoice_type} | {inv.series}-{inv.aa}
                      </span>
                      <span className="font-mono text-sm text-brand-300 shrink-0">
                        €{(inv.total_gross_value || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {inv.customer_name}
                      {inv.customer_vat ? ` · ${inv.customer_vat}` : ""}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
                      MARK: {inv.mark} · {inv.issue_date}
                    </div>
                  </button>
                ))
              )}
              {candidates.length > 50 && (
                <div className="px-4 py-2 text-[11px] text-slate-500 text-center border-t border-slate-800 bg-slate-900/60">
                  Δείχνονται 50 από {candidates.length} αποτελέσματα — εξειδίκευσε
                  την αναζήτηση
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      {!selectedMark && !error && (
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Η επιλογή είναι υποχρεωτική για την έκδοση πιστωτικού.
        </p>
      )}
    </div>
  );
}
