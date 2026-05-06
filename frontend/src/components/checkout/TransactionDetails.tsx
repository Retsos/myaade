import React from "react";
import { Calculator } from "lucide-react";

interface TransactionDetailsProps {
  issueDate: string;
  setIssueDate: (val: string) => void;
  series: string;
  setSeries: (val: string) => void;
  aa: string;
  setAa: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  netValue: string;
  setNetValue: (val: string) => void;
  vatRate: number;
  setVatRate: (val: number) => void;
}

export default function TransactionDetails({
  issueDate,
  setIssueDate,
  series,
  setSeries,
  aa,
  setAa,
  description,
  setDescription,
  netValue,
  setNetValue,
  vatRate,
  setVatRate,
}: TransactionDetailsProps) {
  return (
    <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-brand-400" />
        Στοιχεία Συναλλαγής & Ποσά
      </h2>

      {/* Πρώτη Γραμμή: Ημερομηνία, Σειρά, Α/Α, Αιτιολογία */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Ημερομηνία Έκδοσης
          </label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Σειρά
          </label>
          <input
            type="text"
            value={series}
            onChange={(e) => setSeries(e.target.value.toUpperCase())}
            placeholder="π.χ. Α"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Α/Α
          </label>
          <input
            type="text"
            value={aa}
            onChange={(e) => setAa(e.target.value)}
            placeholder="π.χ. 1"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Αιτιολογία
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="π.χ. Παροχή Υπηρεσιών"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Δεύτερη Γραμμή: Αξία και ΦΠΑ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Καθαρή Αξία (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={netValue}
            onChange={(e) => setNetValue(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-lg text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Συντελεστής ΦΠΑ
          </label>
          <select
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
          >
            <option value={24}>Κανονικός (24%)</option>
            <option value={13}>Μειωμένος (13%)</option>
            <option value={6}>Υπερμειωμένος (6%)</option>
            <option value={0}>Μηδενικός (0%)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
