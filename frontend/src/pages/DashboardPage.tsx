import { useEffect, useState } from "react";
import { FileText, Users, TrendingUp, Receipt, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getInvoices } from "../api";
import type { InvoiceRecord } from "../types";
import { Skeleton, SkeletonStatCard } from "../components/ui/Skeleton";
import { useAppStore } from "../store/useAppStore";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
  bgAccent: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bgAccent,
}: StatCardProps) {
  return (
    <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center ${bgAccent}`}
      >
        <Icon className={`w-5 h-5 ${accent}`} />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
          {label}
        </p>
        <p className="text-xl font-semibold text-slate-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const company = useAppStore((s) => s.company);
  const customers = useAppStore((s) => s.customers);
  const loadCompany = useAppStore((s) => s.loadCompany);
  const loadCustomers = useAppStore((s) => s.loadCustomers);

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    loadCompany().catch(() => null);
    loadCustomers().catch(() => []);
    getInvoices({ limit: 0 })
      .then((invs) => {
        let safeInvoices: InvoiceRecord[] = [];
        if (invs?.success && Array.isArray(invs.invoices)) {
          safeInvoices = invs.invoices;
        } else if (Array.isArray(invs)) {
          safeInvoices = invs;
        }
        setInvoices(safeInvoices);
      })
      .catch(() => {})
      .finally(() => setInvoicesLoading(false));
  }, [loadCompany, loadCustomers]);

  const loading = invoicesLoading;

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (inv.total_gross_value || 0),
    0,
  );
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Καλωσήρθες{company?.name ? `, ${company.name}` : ""}. Σύνοψη
          δραστηριότητας.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              icon={FileText}
              label="Παραστατικά"
              value={invoices.length}
              accent="text-brand-400"
              bgAccent="bg-brand-500/15"
            />
            <StatCard
              icon={Users}
              label="Πελάτες"
              value={customers.length}
              accent="text-emerald-400"
              bgAccent="bg-emerald-500/15"
            />
            <StatCard
              icon={TrendingUp}
              label="Σύνολο Εσόδων"
              value={`€${totalRevenue.toLocaleString("el-GR", { minimumFractionDigits: 2 })}`}
              accent="text-amber-400"
              bgAccent="bg-amber-500/15"
            />
            <StatCard
              icon={Receipt}
              label="Τελευταίο MARK"
              value={invoices.length > 0 ? invoices[0].mark || "—" : "—"}
              accent="text-rose-400"
              bgAccent="bg-rose-500/15"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Πρόσφατα Παραστατικά
            </h2>
            <button
              onClick={() => navigate("/history")}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              Όλα <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              ))
            ) : recentInvoices.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-500">
                  Δεν υπάρχουν παραστατικά ακόμα
                </p>
              </div>
            ) : (
              recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-slate-200">
                      {inv.customer_name || "Άγνωστος"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {inv.series}-{inv.aa} · {inv.issue_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-200">
                      €{(inv.total_gross_value || 0).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      {inv.mark ? `MARK: ${inv.mark}` : "Pending"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">
              Γρήγορες Ενέργειες
            </h2>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={() => navigate("/checkout")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 hover:bg-brand-500/20 transition-colors text-left"
            >
              <FileText className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Νέο Παραστατικό</p>
                <p className="text-[11px] text-slate-500">
                  Έκδοση τιμολογίου ή απόδειξης
                </p>
              </div>
            </button>
            <button
              onClick={() => navigate("/customers")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-colors text-left"
            >
              <Users className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Πελατολόγιο</p>
                <p className="text-[11px] text-slate-500">Διαχείριση πελατών</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/company")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-colors text-left"
            >
              <Receipt className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Στοιχεία Επιχείρησης</p>
                <p className="text-[11px] text-slate-500">
                  Προβολή στοιχείων Issuer
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
