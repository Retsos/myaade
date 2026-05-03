import { useEffect, useState } from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Hash, Landmark, Briefcase } from 'lucide-react';
import { getCompany } from '../api';
import type { Company } from '../types';
import { PageLoader } from '../components/Spinner';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
      <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
        <p className="text-sm text-slate-200 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCompany().then(setCompany).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (error) return (
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center">
      <p className="text-rose-300 text-sm">{error}</p>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Στοιχεία Επιχείρησης</h1>
        <p className="text-sm text-slate-500 mt-1">Στοιχεία Εκδότη (Issuer) από τη βάση δεδομένων.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            <Building2 className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-200">Γενικά Στοιχεία</h2>
          </div>
          <div className="px-5 py-2">
            <InfoRow icon={Building2} label="Επωνυμία" value={company?.name} />
            <InfoRow icon={Briefcase} label="Τίτλος" value={company?.title} />
            <InfoRow icon={Hash} label="ΑΦΜ" value={company?.vat_number} />
            <InfoRow icon={Landmark} label="ΔΟΥ" value={company?.doy_name ? `${company.doy_name} (${company.doy_code})` : company?.doy_code} />
            <InfoRow icon={Briefcase} label="Δραστηριότητα" value={company?.activity} />
            <InfoRow icon={Hash} label="ΓΕΜΗ" value={company?.gemh} />
          </div>
        </div>
        <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">Διεύθυνση & Επικοινωνία</h2>
          </div>
          <div className="px-5 py-2">
            <InfoRow icon={MapPin} label="Διεύθυνση" value={company?.street ? `${company.street} ${company.street_number || ''}, ${company.city} ${company.postal_code}` : company?.city} />
            <InfoRow icon={MapPin} label="Χώρα" value={company?.country} />
            <InfoRow icon={Hash} label="Υποκατάστημα" value={company?.branch} />
            <InfoRow icon={Phone} label="Τηλέφωνο" value={company?.phone} />
            <InfoRow icon={Mail} label="Email" value={company?.email} />
            <InfoRow icon={Globe} label="Website" value={company?.website} />
          </div>
        </div>
      </div>
    </div>
  );
}
