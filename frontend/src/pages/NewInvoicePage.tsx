import { useEffect, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { getCustomers, saveInvoiceRecord, sendInvoice } from "../api";
import type { Customer, InvoiceItem } from "../types";
import { INVOICE_TYPES, VAT_CATEGORIES } from "../types";
import { PageLoader, Spinner } from "../components/Spinner";
import Toast from "../components/Toast";

const emptyItem = (): InvoiceItem => ({
  name: "",
  net_value: "",
  vat_category: 1,
  quantity: 1,
});

export default function NewInvoicePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [invoiceType, setInvoiceType] = useState("2.1");
  const [series, setSeries] = useState("A");
  const [aa, setAa] = useState("1");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calcVat = (netVal: number, vatCat: number) => {
    const rate = VAT_CATEGORIES.find((v) => v.value === vatCat)?.rate ?? 0.24;
    return parseFloat((netVal * rate).toFixed(2));
  };

  const totalNet = items.reduce(
    (sum, item) => sum + (parseFloat(item.net_value) || 0),
    0,
  );
  const totalVat = items.reduce(
    (sum, item) =>
      sum + calcVat(parseFloat(item.net_value) || 0, item.vat_category),
    0,
  );
  const totalGross = parseFloat((totalNet + totalVat).toFixed(2));

  const handleSubmit = async () => {
    if (!customerId) {
      setToast({ type: "error", message: "Επιλέξτε πελάτη." });
      return;
    }

    const validItems = items.filter(
      (i) => i.name && parseFloat(i.net_value) > 0,
    );
    if (validItems.length === 0) {
      setToast({ type: "error", message: "Προσθέστε τουλάχιστον μία γραμμή." });
      return;
    }

    const typeName =
      INVOICE_TYPES.find((t) => t.value === invoiceType)
        ?.label?.split("—")[1]
        ?.trim() || "Τιμολόγιο";

    setSending(true);
    try {
      const result = await sendInvoice({
        customer_id: parseInt(customerId),
        invoice_type: invoiceType,
        invoice_type_name: typeName,
        series,
        aa,
        issue_date: issueDate,
        items: validItems.map((i) => ({
          name: i.name,
          net_value: parseFloat(i.net_value),
          vat_category: i.vat_category,
          quantity: i.quantity,
          vat_exemption_category: i.vat_category === 7 ? 7 : undefined,
          ubl_vat_category: i.vat_category === 7 ? "E" : undefined,
        })),
      });

      const customer = customers.find((c) => c.id === parseInt(customerId));
      await saveInvoiceRecord({
        customer_name: customer?.display_name || "",
        customer_vat: customer?.vat_number || "",
        invoice_type: invoiceType,
        series,
        aa,
        issue_date: issueDate,
        total_net_value: totalNet,
        total_vat_amount: totalVat,
        total_gross_value: totalGross,
        mark: String(result.invoice_mark || ""),
        uid: result.invoice_uid || "",
        invoice_url: result.invoice_url || "",
      }).catch(() => {});

      setToast({
        type: "success",
        message: `Επιτυχής αποστολή! MARK: ${result.invoice_mark || "N/A"}`,
      });
      setItems([emptyItem()]);
      setAa(String(parseInt(aa) + 1));
    } catch (err: unknown) {
      const e = (err as any)?.response?.data || (err as any);
      setToast({
        type: "error",
        message:
          e.user_message ||
          e.error_description ||
          e.message ||
          "Αποτυχία αποστολής.",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoader />;

  const inputCls =
    "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors";
  const labelCls =
    "block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5";

  return (
    <div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Νέο Τιμολόγιο</h1>
        <p className="text-sm text-slate-500 mt-1">
          Συμπλήρωσε τα στοιχεία και αποστολή στο myDATA.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Πελάτης</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={inputCls}
              >
                <option value="">- Επιλέξτε πελάτη -</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name} ({c.vat_number})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Τύπος</label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value)}
                className={inputCls}
              >
                {INVOICE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Σειρά</label>
              <input
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Α/Α</label>
              <input
                value={aa}
                onChange={(e) => setAa(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Ημερομηνία</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Γραμμές παραστατικού
            </h2>
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-lg hover:bg-brand-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Γραμμή
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const net = parseFloat(item.net_value) || 0;
              const vat = calcVat(net, item.vat_category);
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-900/50 rounded-lg p-3 border border-slate-800"
                >
                  <div className="sm:col-span-5">
                    <input
                      placeholder="Περιγραφή"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={item.net_value}
                      onChange={(e) =>
                        updateItem(idx, "net_value", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={item.vat_category}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "vat_category",
                          parseInt(e.target.value),
                        )
                      }
                      className={inputCls}
                    >
                      {VAT_CATEGORIES.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 text-sm font-mono text-slate-300">
                    €{(net + vat).toFixed(2)}
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="text-slate-600 hover:text-rose-400 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2 text-sm">
            <p className="text-slate-400">
              Καθαρή αξία:{" "}
              <span className="font-mono text-slate-200">
                €{totalNet.toFixed(2)}
              </span>
            </p>
            <p className="text-slate-400">
              ΦΠΑ:{" "}
              <span className="font-mono text-slate-200">
                €{totalVat.toFixed(2)}
              </span>
            </p>
            <p className="text-slate-200 font-semibold">
              Σύνολο:{" "}
              <span className="font-mono text-brand-300">
                €{totalGross.toFixed(2)}
              </span>
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium rounded-lg transition-colors min-w-[200px]"
          >
            {sending ? (
              <>
                <Spinner size={16} className="text-white" /> Αποστολή...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Αποστολή στο myDATA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
