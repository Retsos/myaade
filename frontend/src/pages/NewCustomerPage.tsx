import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Save, ArrowLeft } from 'lucide-react';
import { addCustomer } from '../api';
import Toast from '../components/Toast';

export default function NewCustomerPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [form, setForm] = useState({
    display_name: '',
    vat_number: '',
    country: 'GR',
    city: '',
    postal_code: '',
    street: '',
    street_number: '',
    email: '',
    phone: '',
    doy_name: '',
    activity: '',
    branch: '0'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.display_name || !form.vat_number) {
      setToast({ type: 'error', message: 'Τα πεδία Επωνυμία και ΑΦΜ είναι υποχρεωτικά.' });
      return;
    }
    
    setLoading(true);
    try {
      await addCustomer({ ...form, branch: parseInt(form.branch) || 0 });
      setToast({ type: 'success', message: 'Ο πελάτης καταχωρήθηκε επιτυχώς!' });
      setTimeout(() => {
        navigate('/customers');
      }, 1500);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Αποτυχία καταχώρησης πελάτη.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/customers')}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-500" />
            Νέος Πελάτης
          </h1>
          <p className="text-sm text-slate-500 mt-1">Καταχωρήστε τα στοιχεία του νέου πελάτη</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-850 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
        
        {/* Βασικά Στοιχεία */}
        <section>
          <h2 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">Βασικά Στοιχεία</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-2">Επωνυμία / Ονοματεπώνυμο *</label>
              <input
                value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                placeholder="π.χ. Παπαδόπουλος Ιωάννης"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Α.Φ.Μ. *</label>
              <input
                value={form.vat_number}
                onChange={e => setForm({ ...form, vat_number: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors font-mono"
                placeholder="π.χ. 123456789"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Δ.Ο.Υ.</label>
              <input
                value={form.doy_name}
                onChange={e => setForm({ ...form, doy_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                placeholder="π.χ. Α' Αθηνών"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-2">Δραστηριότητα / Επάγγελμα</label>
              <input
                value={form.activity}
                onChange={e => setForm({ ...form, activity: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                placeholder="π.χ. Εμπόριο Η/Υ"
              />
            </div>
          </div>
        </section>

        {/* Διεύθυνση */}
        <section>
          <h2 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">Διεύθυνση Έδρας</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-2">Οδός</label>
                <input
                  value={form.street}
                  onChange={e => setForm({ ...form, street: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                  placeholder="π.χ. Ερμού"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Αριθμός</label>
                <input
                  value={form.street_number}
                  onChange={e => setForm({ ...form, street_number: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                  placeholder="π.χ. 12"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Πόλη / Περιοχή</label>
              <input
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                placeholder="π.χ. Αθήνα"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Τ.Κ.</label>
              <input
                value={form.postal_code}
                onChange={e => setForm({ ...form, postal_code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors font-mono"
                placeholder="π.χ. 10563"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Χώρα</label>
              <input
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                placeholder="π.χ. GR"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Αριθμός Εγκατάστασης (Υποκατάστημα)</label>
              <input
                type="number"
                value={form.branch}
                onChange={e => setForm({ ...form, branch: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                placeholder="0 για κεντρικό"
              />
            </div>
          </div>
        </section>

        {/* Επικοινωνία */}
        <section>
          <h2 className="text-sm font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">Στοιχεία Επικοινωνίας</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                placeholder="π.χ. info@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Τηλέφωνο</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                placeholder="π.χ. 2101234567"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Ακύρωση
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Αποθήκευση...' : 'Αποθήκευση Πελάτη'}
          </button>
        </div>
      </form>
    </div>
  );
}
