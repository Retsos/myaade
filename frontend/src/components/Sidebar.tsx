import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FilePlus,
  FileText,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/company', icon: Building2, label: 'Στοιχεία Επιχείρησης' },
  { to: '/customers', icon: Users, label: 'Πελατολόγιο' },
  { to: '/new-invoice', icon: FilePlus, label: 'Νέο Τιμολόγιο' },
  { to: '/invoices', icon: FileText, label: 'Ιστορικό' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">e-Invoice</h1>
            <p className="text-[11px] text-slate-500 font-medium">myDATA Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-500/15 text-brand-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-[11px] text-slate-600">
          Σύνδεση: <span className="text-emerald-500">●</span> localhost:3000
        </p>
      </div>
    </aside>
  );
}
