import { useState, useEffect } from "react";
import {
  sendInvoice,
  createSimSign,
  sendSimInvoice,
  saveInvoiceRecord,
} from "../api";
import type { SeriesOption } from "../types";
import { useAppStore } from "../store/useAppStore";
import Toast from "../components/Toast";

import DocumentTypeSelector from "../components/checkout/DocumentTypeSelector";
import CustomerSelector from "../components/checkout/CustomerSelector";
import TransactionDetails from "../components/checkout/TransactionDetails";
import CheckoutSummary from "../components/checkout/CheckoutSummary";

const B2B_TYPES = ["1.1", "2.1", "2.4", "5.1"];
const RETAIL_TYPES = ["11.1", "11.2"];

export default function UnifiedCheckoutPage() {
  const customers = useAppStore((s) => s.customers);
  const loadCustomers = useAppStore((s) => s.loadCustomers);
  const allSeries = useAppStore((s) => s.series);
  const loadSeries = useAppStore((s) => s.loadSeries);
  const refreshSeries = useAppStore((s) => s.refreshSeries);

  const [documentType, setDocumentType] = useState<"invoice" | "retail">(
    "retail",
  );
  const [customerId, setCustomerId] = useState<number | null>(null);

  const [netValue, setNetValue] = useState<string>("");
  const [vatRate, setVatRate] = useState<number>(24);
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [series, setSeries] = useState("");
  const [aa, setAa] = useState("1");

  const allowedTypes =
    documentType === "invoice" ? B2B_TYPES : RETAIL_TYPES;
  const availableSeries = allSeries.filter((s) =>
    allowedTypes.includes(s.invoice_type),
  );
  const selectedSeries = availableSeries.find((s) => s.name === series);
  const actualInvoiceType =
    selectedSeries?.invoice_type ||
    (documentType === "invoice" ? "2.1" : "11.1");
  const [description, setDescription] = useState("Πώληση Εμπορευμάτων");

  // Derived Values
  const numericNetValue = parseFloat(netValue) || 0;
  const vatAmount = numericNetValue * (vatRate / 100);
  const grossValue = numericNetValue + vatAmount;

  useEffect(() => {
    loadCustomers().catch((err) => {
      console.error("Failed to load customers", err);
      setToast({ type: "error", message: "Αποτυχία φόρτωσης πελατών." });
    });
    loadSeries().catch((err) => console.error("Failed to fetch series", err));
  }, [loadCustomers, loadSeries]);

  // Όταν αλλάζει ο τύπος παραστατικού ή φορτωθούν οι σειρές, διάλεξε σωστή σειρά
  useEffect(() => {
    if (availableSeries.length === 0) return;
    if (!availableSeries.find((s) => s.name === series)) {
      setSeries(availableSeries[0].name);
      setAa(String(availableSeries[0].next_aa));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType, allSeries]);

  // Όταν αλλάζει η σειρά, γέμισε το αα από το next_aa της σειράς
  useEffect(() => {
    const found = availableSeries.find((s) => s.name === series);
    if (found) setAa(String(found.next_aa));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, allSeries]);

  const getVatCategory = (rate: number) => {
    if (rate === 24) return 1;
    if (rate === 13) return 2;
    if (rate === 6) return 3;
    if (rate === 0) return 7;
    return 1;
  };

  const handleCheckout = async (paymentMethod: "CASH" | "POS" | "PENDING") => {
    if (numericNetValue <= 0) {
      setToast({
        type: "error",
        message: "Η καθαρή αξία πρέπει να είναι μεγαλύτερη από 0.",
      });
      return;
    }

    if (documentType === "invoice" && !customerId) {
      setToast({
        type: "error",
        message: "Παρακαλώ επιλέξτε πελάτη για το τιμολόγιο.",
      });
      return;
    }

    setLoading(true);
    try {
      const isInvoice = documentType === "invoice";
      const invoiceTypeName =
        selectedSeries?.description ||
        (isInvoice ? "Τιμολόγιο Πώλησης" : "Απόδειξη Λιανικής");

      const items = [
        {
          name: description || (isInvoice ? "Πώληση" : "Λιανική"),
          net_value: numericNetValue,
          vat_category: getVatCategory(vatRate),
          quantity: 1,
          vat_exemption_category: getVatCategory(vatRate) === 7 ? 7 : undefined,
          ubl_vat_category: getVatCategory(vatRate) === 7 ? "E" : undefined,
        },
      ];

      let result;

      if (paymentMethod === "POS") {
        const simSignPayload = {
          aa: aa,
          issue_date: issueDate,
          series: series,
          invoice_type: actualInvoiceType,
          net_value: numericNetValue,
          vat_amount: vatAmount,
          total_value: grossValue,
        };

        const signResult = await createSimSign(simSignPayload);

        const invoicePayload = {
          invoice_type: actualInvoiceType,
          invoice_type_name: invoiceTypeName,
          customer_id: isInvoice ? customerId : null,
          issue_date: issueDate,
          series: series,
          aa: aa,
          items: items,
          payment_type: 8, // pos payment
          signature: signResult.signature,
          transaction_id: signResult.raw?.response?.posTransactionId,
        };

        result = await sendSimInvoice(invoicePayload);

        setToast({
          type: "success",
          message: `${invoiceTypeName} εκδόθηκε επιτυχώς με πληρωμή POS!`,
        });
      } else {
        // Normal flow (CASH or PENDING)
        const payload = {
          invoice_type: actualInvoiceType,
          invoice_type_name: invoiceTypeName,
          customer_id: isInvoice ? customerId : null,
          issue_date: issueDate,
          series: series,
          aa: aa,
          items: items,
          payment_type: paymentMethod === "CASH" ? 3 : 5, // 3: Μετρητά, 5: Επί Πιστώσει (PENDING)
        };

        result = await sendInvoice(payload);
        setToast({
          type: "success",
          message: isInvoice
            ? "Το τιμολόγιο εκδόθηκε επιτυχώς!"
            : "Η απόδειξη εκδόθηκε επιτυχώς!",
        });
      }

      // Save to local database
      const customer = customers.find((c) => c.id === customerId);
      await saveInvoiceRecord({
        customer_name: isInvoice
          ? customer?.display_name || ""
          : "Πελάτης Λιανικής",
        customer_vat: isInvoice ? customer?.vat_number || "" : "",
        invoice_type: actualInvoiceType,
        series: series,
        aa: aa,
        issue_date: issueDate,
        total_net_value: numericNetValue,
        total_vat_amount: vatAmount,
        total_gross_value: grossValue,
        mark: String(result.invoice_mark || ""),
        uid: result.invoice_uid || "",
        invoice_url: result.invoice_url || "",
        status:
          paymentMethod === "CASH"
            ? "PAID-CASH"
            : paymentMethod === "POS"
              ? "PAID-POS"
              : "PENDING",
        payment_method: paymentMethod,
      }).catch((e) => console.error("Failed to save to db", e));

      // Reset form on success
      setNetValue("");
      if (isInvoice) setCustomerId(null);

      // Refresh all series counters from DB
      try {
        const fresh = await refreshSeries();
        const found = fresh.find((s: SeriesOption) => s.name === series);
        if (found) setAa(String(found.next_aa));
      } catch (e) {
        console.error("Failed to refresh series after success", e);
        setAa((parseInt(aa, 10) + 1).toString());
      }
    } catch (err: any) {
      console.error("Checkout failed:", err);

      // AADE error 603: AA already used. Backend already bumped next_aa server-side —
      // refresh the local series so the UI picks up the new counter.
      if (err?.error_code === 603) {
        try {
          const fresh = await refreshSeries();
          const found = fresh.find((s: SeriesOption) => s.name === series);
          if (found) setAa(String(found.next_aa));
        } catch {
          /* non-fatal */
        }
      }

      setToast({
        type: "error",
        message:
          err?.error_description ||
          err?.message ||
          "Παρουσιάστηκε σφάλμα κατά την έκδοση του παραστατικού.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-semibold text-slate-100">
          Ταμείο / Έκδοση Παραστατικών
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ενιαίο σημείο πώλησης για τιμολόγια και αποδείξεις
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <DocumentTypeSelector
            documentType={documentType}
            setDocumentType={setDocumentType}
          />

          <CustomerSelector
            documentType={documentType}
            customerId={customerId}
            setCustomerId={setCustomerId}
            customers={customers}
          />

          <TransactionDetails
            issueDate={issueDate}
            setIssueDate={setIssueDate}
            series={series}
            setSeries={setSeries}
            availableSeries={availableSeries}
            description={description}
            setDescription={setDescription}
            netValue={netValue}
            setNetValue={setNetValue}
            vatRate={vatRate}
            setVatRate={setVatRate}
          />
        </div>

        {/* Right Column: Summary & Payment Actions */}
        <div className="space-y-6">
          <CheckoutSummary
            numericNetValue={numericNetValue}
            vatRate={vatRate}
            vatAmount={vatAmount}
            grossValue={grossValue}
            documentType={documentType}
            customerId={customerId}
            loading={loading}
            handleCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
