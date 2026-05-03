import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Search, X, XCircle } from 'lucide-react';
import { cancelInvoice, getInvoices } from '../api';
import type { InvoiceRecord } from '../types';
import { PageLoader, Spinner } from '../components/Spinner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [invoiceToCancel, setInvoiceToCancel] = useState<InvoiceRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getInvoices().then(setInvoices).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const confirmCancel = async () => {
    if (!invoiceToCancel || invoiceToCancel.status === 'cancelled') return;

    setCancelling(true);
    try {
      const cancelledInvoice = await cancelInvoice(invoiceToCancel.id);
      setInvoices(prev => prev.map(inv => inv.id === invoiceToCancel.id ? cancelledInvoice : inv));
      setInvoiceToCancel(null);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageLoader />;

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (inv.customer_name || '').toLowerCase().includes(q)
      || (inv.mark || '').toLowerCase().includes(q)
      || (inv.series || '').toLowerCase().includes(q)
      || (inv.aa || '').toLowerCase().includes(q);
  });

  const cancelIdentifier = invoiceToCancel
    ? invoiceToCancel.mark || invoiceToCancel.uid || `${invoiceToCancel.series}-${invoiceToCancel.aa}`
    : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Ιστορικό Τιμολογίων</h1>
          <p className="text-sm text-slate-500 mt-1">{invoices.length} παραστατικά</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Αναζήτηση..."
            className="pl-9 pr-4 py-2 bg-slate-850 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors w-64"
          />
        </div>
      </div>

      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Σειρά/Αρ</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Πελάτης</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Τύπος</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Ημ/νία</th>
                <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-slate-500 font-medium">Σύνολο</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">MARK</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Status</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    {search ? 'Δεν βρέθηκαν αποτελέσματα' : 'Δεν υπάρχουν παραστατικά'}
                  </td>
                </tr>
              ) : filtered.map(inv => {
                const isCancelled = inv.status === 'cancelled';
                const rowClass = isCancelled
                  ? 'bg-slate-900/50 opacity-55 line-through decoration-slate-400'
                  : 'hover:bg-slate-800/50';
                const textClass = isCancelled ? 'text-slate-500' : 'text-slate-200';
                const mutedClass = isCancelled ? 'text-slate-600' : 'text-slate-400';

                return (
                  <tr key={inv.id} className={`${rowClass} transition-colors`}>
                    <td className={`px-5 py-3 font-mono text-xs ${textClass}`}>{inv.series}-{inv.aa}</td>
                    <td className={`px-5 py-3 ${textClass}`}>{inv.customer_name || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-md ${isCancelled ? 'bg-slate-700/40 text-slate-500' : 'bg-brand-500/15 text-brand-300'}`}>
                        {inv.invoice_type}
                      </span>
                    </td>
                    <td className={`px-5 py-3 ${mutedClass}`}>{inv.issue_date}</td>
                    <td className={`px-5 py-3 text-right font-mono ${textClass}`}>€{(inv.total_gross_value || 0).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`font-mono text-xs ${isCancelled ? 'text-slate-600' : 'text-emerald-400'}`}>{inv.mark || '-'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-md ${isCancelled ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                        {isCancelled ? 'cancelled' : inv.status || 'sent'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {inv.invoice_url && (
                          <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-400 transition-colors" title="Προβολή">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setInvoiceToCancel(inv)}
                          disabled={isCancelled}
                          title={isCancelled ? 'Ήδη ακυρωμένο' : 'Ακύρωση'}
                          className="text-slate-500 hover:text-rose-400 disabled:text-slate-700 disabled:cursor-not-allowed transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                  <h2 className="text-sm font-semibold text-slate-100">Ακύρωση παραστατικού</h2>
                  <p className="text-xs text-slate-500">Η εγγραφή θα μαρκαριστεί ως cancelled.</p>
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
                Θέλεις σίγουρα να ακυρώσεις το παραστατικό <span className="font-mono text-slate-100">{cancelIdentifier}</span>;
              </p>
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Προς το παρόν γίνεται μόνο local ακύρωση. Το provider call θα μπει όταν συνδεθούν τα endpoints ακύρωσης.
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
                {cancelling ? <><Spinner size={16} className="text-white" /> Ακύρωση...</> : 'Ακύρωση'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
