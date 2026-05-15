// Unified checkout page: covers both B2B (invoice) and retail (receipt) flows
// in a single screen. The actual myDATA endpoint that's hit depends on the
// chosen payment method, not the document type:
//   - POS      → createSimSign + sendSimInvoice  (signed)
//   - CASH     → sendInvoice with paymentType=3
//   - PENDING  → sendInvoice with paymentType=5  (on-credit, B2B only)
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
import CorrelatedInvoiceSelector from "../components/checkout/CorrelatedInvoiceSelector";

interface CorrelatedInvoice {
  id: number;
  customer_name: string;
  customer_vat?: string;
  invoice_type: string;
  series: string;
  aa: string;
  issue_date: string;
  total_net_value?: number;
  total_gross_value: number;
  mark: string;
  status?: string;
}

// Document-type buckets. The UI exposes only two top-level choices
// ("invoice" vs "retail") but each maps to multiple myDATA invoice types
// available via the series dropdown.
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

  // Credit-note (5.1) state: which past invoice this credit note refers to.
  // When set, the customer is locked and the amount is pre-filled from the
  // original. Reset whenever the selected series leaves "5.1".
  const [correlatedInvoice, setCorrelatedInvoice] =
    useState<CorrelatedInvoice | null>(null);

  // Filter the full series list down to the ones valid for the chosen
  // document type. The real invoice_type that we send to AADE comes from
  // the *selected* series — not from documentType — because each B2B/retail
  // bucket has multiple types (e.g. invoice can be 1.1, 2.1, 2.4, 5.1).
  const allowedTypes =
    documentType === "invoice" ? B2B_TYPES : RETAIL_TYPES;
  const availableSeries = allSeries.filter((s) =>
    allowedTypes.includes(s.invoice_type),
  );
  const selectedSeries = availableSeries.find((s) => s.name === series);
  const actualInvoiceType =
    selectedSeries?.invoice_type ||
    (documentType === "invoice" ? "2.1" : "11.1");
  const isCreditNote = actualInvoiceType === "5.1";
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

  // When the document type changes (or series finish loading), make sure
  // the selected series is one that's actually valid for this bucket.
  // Picks the first available series and resets AA to that series's counter.
  useEffect(() => {
    if (availableSeries.length === 0) return;
    if (!availableSeries.find((s) => s.name === series)) {
      setSeries(availableSeries[0].name);
      setAa(String(availableSeries[0].next_aa));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType, allSeries]);

  // When the user picks a different series, sync AA with that series's next_aa.
  useEffect(() => {
    const found = availableSeries.find((s) => s.name === series);
    if (found) setAa(String(found.next_aa));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, allSeries]);

  // Reset the credit-note correlation whenever the user moves away from
  // the credit-note series (or changes document type entirely).
  useEffect(() => {
    if (!isCreditNote && correlatedInvoice !== null) {
      setCorrelatedInvoice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreditNote]);

  // If the user manually changes the customer to one that doesn't match the
  // currently-correlated original invoice, drop the correlation. Otherwise
  // we'd send a credit note tied to a different customer's invoice.
  useEffect(() => {
    if (!correlatedInvoice) return;
    const currentCustomer = customers.find((c) => c.id === customerId);
    if (
      currentCustomer &&
      correlatedInvoice.customer_vat &&
      currentCustomer.vat_number !== correlatedInvoice.customer_vat
    ) {
      setCorrelatedInvoice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // Pre-fill amount + customer + description from the original invoice when
  // the user picks one. The customer is matched by VAT — if not found in the
  // current customer list (e.g. deleted), we surface a toast and abort.
  const handleCorrelatedSelect = (inv: CorrelatedInvoice | null) => {
    setCorrelatedInvoice(inv);
    if (!inv) return;

    if (inv.customer_vat) {
      const match = customers.find((c) => c.vat_number === inv.customer_vat);
      if (match) {
        setCustomerId(match.id);
      } else {
        setToast({
          type: "error",
          message:
            "Ο πελάτης του αρχικού τιμολογίου δεν υπάρχει πια στο πελατολόγιο. Πρόσθεσέ τον ξανά για να συνεχίσεις.",
        });
      }
    }
    if (typeof inv.total_net_value === "number") {
      setNetValue(String(inv.total_net_value));
    }
    setDescription(`Πιστωτικό για ${inv.series}-${inv.aa}`);
  };

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

    // Credit notes (5.1) cannot be issued without referencing the original invoice.
    if (isCreditNote && !correlatedInvoice?.mark) {
      setToast({
        type: "error",
        message:
          "Επίλεξε το αρχικό παραστατικό που διορθώνει το πιστωτικό πριν την έκδοση.",
      });
      return;
    }

    // Credit notes are by convention issued on credit (paymentType=5). The
    // POS-signing flow (sendSimInvoice) doesn't carry correlatedInvoices in
    // its payload here, so we block POS for credit notes outright.
    if (isCreditNote && paymentMethod === "POS") {
      setToast({
        type: "error",
        message:
          "Τα πιστωτικά τιμολόγια εκδίδονται επί πιστώσει — επίλεξε «Εκκρεμές» αντί για POS.",
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

      // POS path: two-step (createSimSign → sendSimInvoice). Works for both
      // retail (no counterpart) and B2B (with counterpart) — the backend
      // decides based on whether customer_id is provided.
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
        // Non-POS path: single-step /sendInvoice. paymentType 3 = cash,
        // 5 = on-credit (PENDING — B2B only since retail is always paid).
        const payload: Record<string, unknown> = {
          invoice_type: actualInvoiceType,
          invoice_type_name: invoiceTypeName,
          customer_id: isInvoice ? customerId : null,
          issue_date: issueDate,
          series: series,
          aa: aa,
          items: items,
          payment_type: paymentMethod === "CASH" ? 3 : 5, // 3: Μετρητά, 5: Επί Πιστώσει (PENDING)
        };

        // Credit notes: include the MARK of the original invoice that this
        // credit note adjusts. Backend converts these to numbers and puts
        // them under invoiceHeader.correlatedInvoices.
        if (isCreditNote && correlatedInvoice?.mark) {
          payload.correlated_invoices = [correlatedInvoice.mark];
        }

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
      if (isCreditNote) {
        setCorrelatedInvoice(null);
        setDescription("Πώληση Εμπορευμάτων");
      }

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

          {isCreditNote && (
            <CorrelatedInvoiceSelector
              selectedMark={correlatedInvoice?.mark || null}
              selectedInvoice={correlatedInvoice}
              onSelect={handleCorrelatedSelect}
              customerVat={
                customers.find((c) => c.id === customerId)?.vat_number || null
              }
            />
          )}

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
