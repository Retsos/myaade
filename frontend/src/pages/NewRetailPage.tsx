import { useState } from "react";
import { Plus, Receipt, Trash2, Send } from "lucide-react";
import {
  createSimSign,
  sendSimInvoice,
  saveInvoiceRecord,
  getCompany,
} from "../api";
import type { InvoiceItem } from "../types";
import { VAT_CATEGORIES } from "../types";
import { Spinner, SendingOverlay } from "../components/Spinner";
import Toast from "../components/Toast";
const emptyItem = (): InvoiceItem => ({
  name: "",
  net_value: "",
  vat_category: 1,
  quantity: 1,
});

export default function NewRetailPage() {
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [invoiceType, setInvoiceType] = useState("11.1");
  const [series, setSeries] = useState("ΑΛΠ");
  const [aa, setAa] = useState("1");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);

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
    const validItems = items.filter(
      (i) => i.name && parseFloat(i.net_value) > 0,
    );
    if (validItems.length === 0) {
      setToast({ type: "error", message: "Προσθέστε τουλάχιστον μία γραμμή." });
      return;
    }

    setSendingMessage("Βήμα 1/2: Λήψη Υπογραφής από POS...");
    try {
      // 1. SIM SIGNATURE (createSimSign)
      const simSignRes = await createSimSign({
        aa,
        issue_date: issueDate,
        series,
        invoice_type: invoiceType,
        net_value: totalNet,
        vat_amount: totalVat,
        total_value: totalGross,
        nsp_code: "01",
        terminal_id: "54888913",
      });

      const signature = simSignRes.signature;
      if (!signature) {
        throw new Error("Δεν επιστράφηκε υπογραφή (signature) από την ΕΑΦΔΣΣ.");
      }

      // 2. SEND INVOICE
      setSendingMessage("Βήμα 2/2: Αποστολή στο myDATA...");
      const mappedItems = validItems.map((i) => ({
        name: i.name,
        net_value: parseFloat(i.net_value),
        vat_category: i.vat_category,
        quantity: i.quantity,
        vat_exemption_category: i.vat_category === 7 ? 7 : undefined,
        ubl_vat_category: i.vat_category === 7 ? "E" : undefined,
      }));

      const sendRes = await sendSimInvoice({
        invoice_type: invoiceType,
        invoice_type_name: "Απόδειξη Λιανικής",
        series,
        aa,
        issue_date: issueDate,
        items: mappedItems,
        signature,
        payment_type: 8,
      });

      // 3. SAVE HISTORY
      const mark = sendRes.invoice_mark || sendRes.mark;
      if (mark) {
        await saveInvoiceRecord({
          customer_name: "ΛΙΑΝΙΚΗ",
          customer_vat: "",
          invoice_type: invoiceType,
          series,
          aa,
          issue_date: issueDate,
          total_net_value: totalNet,
          total_vat_amount: totalVat,
          total_gross_value: totalGross,
          mark: String(mark),
          uid: sendRes.invoice_uid || "",
          invoice_url: sendRes.invoice_url || "",
        }).catch(() => {});
      }

      setToast({
        type: "success",
        message: `Επιτυχής Έκδοση! MARK: ${mark || "N/A"}`,
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
          e.details?.message ||
          "Αποτυχία έκδοσης απόδειξης.",
      });
    } finally {
      setSendingMessage(null);
    }
  };

  const inputCls =
    "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors";
  const labelCls =
    "block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5";

  return (
    <div>
      {sendingMessage && <SendingOverlay message={sendingMessage} />}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-brand-400" /> Απόδειξη Λιανικής
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Έκδοση απόδειξης και σήμανση μέσω POS.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Τύπος Παραστατικού</label>
              <input
                value="11.1 - Απόδειξη Λιανικής Πώλησης"
                disabled
                className={`${inputCls} opacity-70 cursor-not-allowed`}
              />
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
            <div className="sm:col-span-2 lg:col-span-4">
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
            disabled={!!sendingMessage}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium rounded-lg transition-colors min-w-[200px]"
          >
            {sendingMessage ? (
              <>
                <Spinner size={16} className="text-white" /> Έκδοση...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" /> Έκδοση Απόδειξης
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
