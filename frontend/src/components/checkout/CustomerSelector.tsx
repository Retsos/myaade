import { Users, AlertCircle } from "lucide-react";
import type { Customer } from "../../types";
import Select from "../ui/Select";

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

  const options = customers.map((c) => ({
    value: c.id,
    label: `${c.display_name} — ΑΦΜ: ${c.vat_number}`,
  }));

  return (
    <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-brand-400" />
        Επιλογή Πελάτη
      </h2>
      <Select
        value={customerId || ""}
        onChange={(e) => setCustomerId(Number(e.target.value))}
        options={options}
        placeholder="Επιλέξτε πελάτη από τη λίστα..."
      />
      {!customerId && (
        <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />Η επιλογή πελάτη είναι υποχρεωτική
          για τα τιμολόγια.
        </p>
      )}
    </div>
  );
}
