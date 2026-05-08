import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Zap,
  Receipt,
  X,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/company", icon: Building2, label: "Στοιχεία Επιχείρησης" },
  { to: "/customers", icon: Users, label: "Πελατολόγιο" },
  { to: "/new-customer", icon: Users, label: "Νέος Πελάτης" },
  { to: "/checkout", icon: Receipt, label: "Ταμείο (POS)" },
  { to: "/history", icon: FileText, label: "Ιστορικό" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 h-screen bg-slate-900 border-r border-slate-800
        flex flex-col shrink-0
        transform transition-transform duration-200 ease-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
              e-Invoice
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              myDATA Admin Panel
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-brand-500/15 text-brand-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800 shrink-0">
        <p className="text-[11px] text-slate-600">
          Σύνδεση: <span className="text-emerald-500">●</span> localhost:3000
        </p>
      </div>
    </aside>
  );
}
