import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getCustomers, deleteCustomer } from '../api';
import type { Customer } from '../types';
import Toast from '../components/Toast';
import Button from '../components/ui/Button';
import { SkeletonTableRow } from '../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = () => {
    getCustomers().then(setCustomers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Διαγραφή πελάτη;')) return;
    try {
      await deleteCustomer(id);
      setToast({ type: 'success', message: 'Ο πελάτης διαγράφηκε.' });
      load();
    } catch {
      setToast({ type: 'error', message: 'Αποτυχία διαγραφής.' });
    }
  };

  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Πελατολόγιο</h1>
          <p className="text-sm text-slate-500 mt-1">{customers.length} πελάτες καταχωρημένοι</p>
        </div>
        <Button
          onClick={() => navigate('/new-customer')}
          iconLeft={<Plus className="w-4 h-4" />}
        >
          Νέος Πελάτης
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Επωνυμία</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">ΑΦΜ</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Πόλη</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Email</th>
                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium">Τηλέφωνο</th>
                <th className="px-5 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={6} />
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Δεν υπάρχουν πελάτες</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-3 text-slate-200 font-medium">{c.display_name}</td>
                  <td className="px-5 py-3 text-slate-300 font-mono text-xs">{c.vat_number}</td>
                  <td className="px-5 py-3 text-slate-400">{c.city || '—'}</td>
                  <td className="px-5 py-3 text-slate-400">{c.email || '—'}</td>
                  <td className="px-5 py-3 text-slate-400">{c.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c.id)}
                      className="text-slate-600 hover:text-rose-400"
                      aria-label="Διαγραφή"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
