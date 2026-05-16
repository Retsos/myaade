// Searchable picker for the original invoice that a credit note (5.1) refers to.
//
// Shows a dropdown of past B2B invoices (excluding credit notes themselves and
// cancelled ones), filtered as the user types. Selecting a row exposes the full
// invoice object to the parent via `onSelect` so the parent can also lock the
// customer field and pre-fill the amount.
//
// AADE rule: a credit note must reference at least one MARK in its
// `correlatedInvoices` field. This component produces that MARK.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, AlertCircle, X, Search, FileText } from "lucide-react";
import { getInvoices } from "../../api";

// Only invoice types that *can* be credited belong here. We deliberately
// exclude 5.1 (would be crediting a credit) and the retail types 11.x
// (retail receipts use a different cancellation mechanism).
const B2B_TYPES = ["1.1", "2.1"];

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
  correlated_mark?: string | null; // present only on 5.1 rows
}

interface Props {
  selectedMark: string | null;
  selectedInvoice: InvoiceLite | null;
  onSelect: (invoice: InvoiceLite | null) => void;
  /** When set, the dropdown shows ONLY invoices issued to this VAT. */
  customerVat?: string | null;
  /**
   * Bump this number from the parent to force a refetch — useful after the
   * parent has just issued a new credit note so the dropdown reflects the
   * updated "credited so far" totals immediately.
   */
  refreshKey?: number;
}

export default function CorrelatedInvoiceSelector({
  selectedMark,
  selectedInvoice,
  onSelect,
  customerVat,
  refreshKey = 0,
}: Props) {
  const [allInvoices, setAllInvoices] = useState<InvoiceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch the full invoice list. Backend accepts limit=0 = no pagination.
  // For very large invoice histories this could be paginated server-side later;
  // for the demo's audience size, fetching everything keeps client-side search
  // instant and trivial.
  //
  // Re-fetches whenever `refreshKey` changes — the parent bumps it after each
  // successful issuance so the dropdown immediately reflects new credit notes.
  useEffect(() => {
    setLoading(true);
    getInvoices({ limit: 0 })
      .then((res) => {
        const list: InvoiceLite[] =
          res?.success && Array.isArray(res.invoices) ? res.invoices : [];
        setAllInvoices(list);
      })
      .catch(() => setError("Αποτυχία φόρτωσης ιστορικού."))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Click-outside handler: close the suggestion dropdown when the user clicks
  // anywhere outside this component. We scope the listener with `containerRef`
  // so other dropdowns on the page aren't affected.
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

  // Build a "credited so far" map keyed by original-invoice MARK.
  // For each credit note (5.1) in the local DB, sum its total_gross_value
  // against its correlated_mark. We can then compare against the original's
  // total to decide what's still creditable — and avoid AADE error 319
  // ("net value of correlated invoice is exceeded").
  const creditedByMark = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of allInvoices) {
      if (inv.invoice_type !== "5.1") continue;
      if (!inv.correlated_mark) continue;
      const key = String(inv.correlated_mark);
      map.set(key, (map.get(key) || 0) + (inv.total_gross_value || 0));
    }
    return map;
  }, [allInvoices]);

  // Filter: only B2B (non-credit, non-cancelled) with a MARK; if a customer
  // is already chosen upstream, restrict to invoices issued to that VAT;
  // finally apply the live search query. Candidates carry a computed
  // `remaining` so the dropdown can show a badge / disable fully-credited rows.
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const vatFilter = customerVat?.trim();
    return allInvoices
      .filter((inv) => {
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
      })
      .map((inv) => {
        const credited = creditedByMark.get(String(inv.mark)) || 0;
        const remaining = (inv.total_gross_value || 0) - credited;
        return { ...inv, credited, remaining };
      });
  }, [allInvoices, search, customerVat, creditedByMark]);

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
            του θα σταλεί στην ΑΑΔΕ ως{" "}
            <code className="font-mono">correlatedInvoices</code>.
          </p>
        </div>
      </div>

      {/* Two visual states:
          - selectedInvoice present  → render a "chip"-style summary card with X to clear
          - none yet                 → render the search input and live dropdown */}
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
            <div className="absolute z-20 left-0 right-0 mt-1 max-h-[60vh] min-h-[200px] overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl">
              {candidates.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  {customerVat
                    ? "Ο επιλεγμένος πελάτης δεν έχει συμβατά τιμολόγια."
                    : "Δεν βρέθηκαν συμβατά παραστατικά."}
                </div>
              ) : (
                <>
                  <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm px-4 py-2 text-[11px] text-slate-500 border-b border-slate-800 font-medium">
                    {candidates.length} παραστατικά
                    {customerVat ? " για τον πελάτη" : " διαθέσιμα"}
                    {candidates.length > 5 && " — κάνε scroll για περισσότερα"}
                  </div>
                  {candidates.slice(0, 50).map((inv) => {
                  // 0.005€ tolerance to absorb floating-point rounding when
                  // a partial credit consumed everything except for cents.
                  const exhausted = inv.remaining <= 0.005;
                  const partial = inv.credited > 0 && !exhausted;
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      disabled={exhausted}
                      onClick={() => {
                        if (exhausted) return;
                        onSelect(inv);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-left px-4 py-2.5 border-b border-slate-800 last:border-0 transition-colors ${
                        exhausted
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-slate-800/70"
                      }`}
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
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-600 font-mono">
                          MARK: {inv.mark} · {inv.issue_date}
                        </span>
                        {exhausted ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium shrink-0">
                            Πλήρως πιστωτικό
                          </span>
                        ) : partial ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium font-mono shrink-0">
                            Διαθέσιμο €{inv.remaining.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
                {candidates.length > 50 && (
                  <div className="px-4 py-2 text-[11px] text-slate-500 text-center border-t border-slate-800 bg-slate-900/60">
                    Δείχνονται 50 από {candidates.length} αποτελέσματα — εξειδίκευσε
                    την αναζήτηση
                  </div>
                )}
                </>
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
