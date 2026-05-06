import React from "react";
import { Users, AlertCircle } from "lucide-react";
import type { Customer } from "../../types";

interface CustomerSelectorProps {
  documentType: "invoice" | "retail";
  customerId: number | null;
  setCustomerId: (id: number) => void;
  customers: Customer[];
}

export default function CustomerSelector({
  documentType,
  customerId,
  setCustomerId,
  customers,
}: CustomerSelectorProps) {
  if (documentType !== "invoice") return null;

  return (
    <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-brand-400" />
        Επιλογή Πελάτη
      </h2>
      <div>
        <select
          value={customerId || ""}
          onChange={(e) => setCustomerId(Number(e.target.value))}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
        >
          <option value="" disabled>
            Επιλέξτε πελάτη από τη λίστα...
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name} - ΑΦΜ: {c.vat_number}
            </option>
          ))}
        </select>
        {!customerId && (
          <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />Η επιλογή πελάτη είναι
            υποχρεωτική για τα τιμολόγια.
          </p>
        )}
      </div>
    </div>
  );
}
