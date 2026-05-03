import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, X } from 'lucide-react';
import { getCustomers, addCustomer, deleteCustomer } from '../api';
import type { Customer } from '../types';
import { PageLoader } from '../components/Spinner';
import Toast from '../components/Toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({ display_name: '', vat_number: '', country: 'GR', city: '', postal_code: '', street: '', email: '', phone: '', doy_name: '', activity: '' });

  const load = () => {
    getCustomers().then(setCustomers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.display_name || !form.vat_number) {
      setToast({ type: 'error', message: 'Συμπληρώστε Επωνυμία και ΑΦΜ.' });
      return;
    }
    try {
      await addCustomer(form);
      setShowModal(false);
      setForm({ display_name: '', vat_number: '', country: 'GR', city: '', postal_code: '', street: '', email: '', phone: '', doy_name: '', activity: '' });
      setToast({ type: 'success', message: 'Ο πελάτης προστέθηκε επιτυχώς.' });
      load();
    } catch (err: unknown) {
      setToast({ type: 'error', message: (err as Error).message });
    }
  };

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

  if (loading) return <PageLoader />;

  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Πελατολόγιο</h1>
          <p className="text-sm text-slate-500 mt-1">{customers.length} πελάτες καταχωρημένοι</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Νέος Πελάτης
        </button>
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
              {customers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Δεν υπάρχουν πελάτες</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-3 text-slate-200 font-medium">{c.display_name}</td>
                  <td className="px-5 py-3 text-slate-300 font-mono text-xs">{c.vat_number}</td>
                  <td className="px-5 py-3 text-slate-400">{c.city || '—'}</td>
                  <td className="px-5 py-3 text-slate-400">{c.email || '—'}</td>
                  <td className="px-5 py-3 text-slate-400">{c.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(c.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-slate-200">Νέος Πελάτης</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { key: 'display_name', label: 'Επωνυμία *', span: 2 },
                { key: 'vat_number', label: 'ΑΦΜ *' },
                { key: 'country', label: 'Χώρα' },
                { key: 'city', label: 'Πόλη' },
                { key: 'postal_code', label: 'Τ.Κ.' },
                { key: 'street', label: 'Οδός', span: 2 },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Τηλέφωνο' },
                { key: 'doy_name', label: 'ΔΟΥ' },
                { key: 'activity', label: 'Δραστηριότητα' },
              ].map(({ key, label, span }) => (
                <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Ακύρωση</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">Αποθήκευση</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
