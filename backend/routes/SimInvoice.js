const express = require("express");
const router = express.Router();
const db = require("../db");
const bratnetApi = require("../config");
const { INVOICE_TYPES, VAT_RATES } = require("../invoiceTypes");

router.post("/sendSimInvoice", async (req, res) => {
  const {
    invoice_type,
    series,
    aa,
    issue_date,
    items,
    signature,
    payment_type
  } = req.body;

  if (!signature) {
    return res.status(400).json({ error: "Η υπογραφή (signature) είναι υποχρεωτική για τη Λιανική." });
  }

  const typeConfig = INVOICE_TYPES[invoice_type];
  if (!typeConfig) return res.status(400).json({ error: `Άγνωστος τύπος: ${invoice_type}` });

  const company = db.prepare("SELECT * FROM company WHERE id = 1").get();
  if (!company) return res.status(500).json({ error: "Δεν βρέθηκε η εταιρεία στη βάση." });

  // --- Υπολογισμοί γραμμών ---
  let totalNetValue = 0;
  let totalVatAmount = 0;

  const invoiceDetails = items.map((item, index) => {
    const netValue = parseFloat(item.net_value);
    const vatCat = item.vat_category ?? 1;
    const vatInfo = VAT_RATES[vatCat] ?? VAT_RATES[1];
    const vatAmount = parseFloat((netValue * vatInfo.rate).toFixed(2));

    totalNetValue += netValue;
    totalVatAmount += vatAmount;

    return {
      lineNumber: index + 1,
      code: item.code || `ITEM${String(index + 1).padStart(6, "0")}`,
      name: item.name,
      netValue,
      netValueBeforeDiscount: netValue,
      vatCategory: vatCat,
      vatAmount,
      vatPercent: vatInfo.rate * 100,
      price: netValue,
      priceIncludeVAT: 0,
      quantity: item.quantity || 1,
      measurementUnit: 1,
      measurementUnitName: "ΤΕΜ",
      incomeClassification: [{
        id: 1,
        classificationCategory: typeConfig.defaultClassificationCategory,
        classificationType: typeConfig.defaultClassificationType,
        amount: netValue,
      }],
    };
  });

  totalNetValue = parseFloat(totalNetValue.toFixed(2));
  totalVatAmount = parseFloat(totalVatAmount.toFixed(2));
  const totalGrossValue = parseFloat((totalNetValue + totalVatAmount).toFixed(2));

  // --- Το Payload των απαιτήσεων ---
  const payload = {
    invoice: [{
      B2G: null,        // Απαγορεύεται στη Λιανική
      ublFields: null,  // Απαγορεύεται στη Λιανική
      isUnsigned: true, // Υποχρεωτικό για SimSign

      issuer: {
        vatNumber: company.vat_number,
        branch: company.branch,
        country: company.country,
        name: null, address: null, countryDocumentId: null, documentIdNo: null, supplyAccountNo: null,
      },
      
      counterpart: null, // Ανώνυμος πελάτης

      extra: {
        salerName: company.name,
        salerTitle: company.title,
        salerVat: company.vat_number,
        salerActivity: company.activity,
        salerStreetName: company.street,
        salerCity: company.city,
        salerTk: company.postal_code ? String(company.postal_code) : null,
        salerEmail: company.email,
        salerPhone: company.phone,
        salerWebsite: company.website,
        salerGemh: company.gemh ? String(company.gemh) : "000000000000",
        salerDoyCode: company.doy_code ? parseInt(company.doy_code, 10) : null,
        salerDoyName: company.doy_name,
        
        invoiceTypeName: req.body.invoice_type_name || typeConfig.label,
        paymentMethodName: "Κάρτα (POS)",
        
        // --- ΤΑ ΠΕΔΙΑ ΤΟΥ POS ---
        signature: signature,
        nspCode: "01",
        transactionId: "POS-TRANS-" + Math.floor(Math.random() * 1000000),
        tipAmount: 0
      },

      invoiceHeader: {
        series: series || typeConfig.defaultSeries,
        aa,
        issueDate: issue_date,
        issueTime: new Date().toTimeString().slice(0, 8),
        invoiceType: invoice_type,
        currency: "EUR",
        vatPaymentSuspension: false,
      },

      invoiceDetails,

      invoiceVatAnalysis: [{
        vatCategory: items[0].vat_category ?? 1,
        vatPercent: (VAT_RATES[items[0].vat_category ?? 1]?.rate ?? 0.24) * 100,
        netValuePerVat: totalNetValue,
        vatAmount: totalVatAmount,
      }],

      invoiceSummary: {
        totalNetValue, totalVatAmount, totalGrossValue, totalPrintGrossValue: totalGrossValue,
        totalDeductionsAmount: 0, totalFeesAmount: 0, totalStampDutyAmount: 0, totalOtherTaxesAmount: 0, totalWithheldAmount: 0,
        incomeClassification: [{
          id: 1,
          classificationCategory: typeConfig.defaultClassificationCategory,
          classificationType: typeConfig.defaultClassificationType,
          amount: totalNetValue,
        }],
      },

      paymentMethods: {
        paymentMethodDetails: [{
          type: payment_type || 8, // 8 = Κάρτα POS
          amount: totalGrossValue,
        }],
      },

      tidNsp: "54888913", // Υποχρεωτικό ID Τερματικού
    }],
  };

  try {
    const finalResponse = await bratnetApi.post("/sendSimInvoice", payload);
    const finalApiData = finalResponse.data;

    // Διαχείριση λαθών Bratnet & myDATA
    if (finalApiData?.response?.paroxosError) {
      return res.status(400).json({ success: false, error_description: finalApiData.response.paroxosError.description, raw: finalApiData });
    }
    if (finalApiData?.response?.errors?.length > 0) {
      return res.status(400).json({ success: false, error_description: finalApiData.response.errors[0].message, raw: finalApiData });
    }

    const result = finalApiData?.response?.responses?.[0];
    return res.status(200).json({
      success: true,
      invoice_mark: result?.invoiceMark,
      invoice_uid: result?.invoiceUid,
      invoice_url: result?.invoiceUrl,
      raw: finalApiData,
    });

  } catch (err) {
    console.error("sendSimInvoice Error:", err.response?.data || err.message);
    return res.status(500).json({ 
      success: false, 
      error_description: "Αποτυχία αποστολής στο myDATA μέσω POS.",
      details: err.response?.data || err.message
    });
  }
});

module.exports = router;