import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomers,
  sendInvoice,
  createSimSign,
  sendSimInvoice,
  getInvoices,
  saveInvoiceRecord,
} from "../api";
import type { Customer } from "../types";
import Toast from "../components/Toast";

import DocumentTypeSelector from "../components/checkout/DocumentTypeSelector";
import CustomerSelector from "../components/checkout/CustomerSelector";
import TransactionDetails from "../components/checkout/TransactionDetails";
import CheckoutSummary from "../components/checkout/CheckoutSummary";

export default function UnifiedCheckoutPage() {
  // State Management
  const [documentType, setDocumentType] = useState<"invoice" | "retail">(
    "retail",
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [series, setSeries] = useState("Α");
  const [aa, setAa] = useState("1");
  const [description, setDescription] = useState("Πώληση Εμπορευμάτων");

  // Derived Values
  const numericNetValue = parseFloat(netValue) || 0;
  const vatAmount = numericNetValue * (vatRate / 100);
  const grossValue = numericNetValue + vatAmount;

  useEffect(() => {
    // Load customers for B2B selection
    getCustomers()
      .then(setCustomers)
      .catch((err) => {
        console.error("Failed to load customers", err);
        setToast({ type: "error", message: "Αποτυχία φόρτωσης πελατών." });
      });
  }, []);

  useEffect(() => {
    getInvoices()
      .then((res) => {
        if (res.success && res.invoices) {
          const type = documentType === "invoice" ? "2.1" : "11.1";
          const filtered = res.invoices.filter(
            (i: any) => i.series === series && i.invoice_type === type,
          );
          const maxAa = filtered.reduce((max: number, inv: any) => {
            const currentAa = parseInt(inv.aa, 10) || 0;
            return currentAa > max ? currentAa : max;
          }, 0);
          setAa((maxAa + 1).toString());
        }
      })
      .catch((err) => console.error("Failed to fetch AA", err));
  }, [documentType, series]);

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
      const actualInvoiceType = isInvoice ? "2.1" : "11.1";
      const invoiceTypeName = isInvoice
        ? "Τιμολόγιο Πώλησης"
        : "Απόδειξη Λιανικής";

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
      setAa((parseInt(aa, 10) + 1).toString());
    } catch (err: any) {
      console.error("Checkout failed:", err);
      setToast({
        type: "error",
        message:
          err.message ||
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
            aa={aa}
            setAa={setAa}
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
