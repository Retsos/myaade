import { Calculator } from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface SeriesOption {
  id: number;
  name: string;
  next_aa: number;
  invoice_type: string;
  description?: string;
}

interface TransactionDetailsProps {
  issueDate: string;
  setIssueDate: (val: string) => void;
  series: string;
  setSeries: (val: string) => void;
  availableSeries: SeriesOption[];
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
  availableSeries,
  description,
  setDescription,
  netValue,
  setNetValue,
  vatRate,
  setVatRate,
}: TransactionDetailsProps) {
  const seriesOptions =
    availableSeries.length === 0
      ? [{ value: "", label: "-- φόρτωση --", disabled: true }]
      : availableSeries.map((s) => ({
          value: s.name,
          label: s.description ? `${s.name} — ${s.description}` : s.name,
        }));

  const vatOptions = [
    { value: 24, label: "Κανονικός (24%)" },
    { value: 13, label: "Μειωμένος (13%)" },
    { value: 6, label: "Υπερμειωμένος (6%)" },
    { value: 0, label: "Μηδενικός (0%)" },
  ];

  return (
    <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-brand-400" />
        Στοιχεία Συναλλαγής & Ποσά
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          label="Ημερομηνία Έκδοσης"
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
        />
        <Select
          label="Σειρά"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
          options={seriesOptions}
        />
        <Input
          label="Αιτιολογία"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="π.χ. Παροχή Υπηρεσιών"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
        <Input
          label="Καθαρή Αξία (€)"
          type="number"
          min="0"
          step="0.01"
          value={netValue}
          onChange={(e) => setNetValue(e.target.value)}
          placeholder="0.00"
          className="text-lg font-mono"
        />
        <Select
          label="Συντελεστής ΦΠΑ"
          value={vatRate}
          onChange={(e) => setVatRate(Number(e.target.value))}
          options={vatOptions}
        />
      </div>
    </div>
  );
}
