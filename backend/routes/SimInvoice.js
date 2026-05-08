const express = require("express");
const router = express.Router();
const db = require("../db");
const bratnetApi = require("../config");
const { INVOICE_TYPES, VAT_RATES } = require("../invoiceTypes");

router.post("/sendSimInvoice", async (req, res) => {
  const {
    customer_id,
    invoice_type,
    series,
    aa,
    issue_date,
    issue_time,
    items,
    signature,
    payment_type,
    transaction_id,
    tip_amount,
    terminal_id,
  } = req.body;

  if (!signature) {
    return res
      .status(400)
      .json({ error: "Η υπογραφή (signature) είναι υποχρεωτική για POS." });
  }

  const typeConfig = INVOICE_TYPES[invoice_type];
  if (!typeConfig)
    return res.status(400).json({ error: `Άγνωστος τύπος: ${invoice_type}` });

  const company = db.prepare("SELECT * FROM company WHERE id = 1").get();
  if (!company)
    return res.status(500).json({ error: "Δεν βρέθηκε η εταιρεία στη βάση." });

  // Optional counterpart (για B2B+POS)
  let customer = null;
  if (typeConfig.requiresCounterpart) {
    if (!customer_id) {
      return res.status(400).json({
        error: `invoice_type "${invoice_type}" (${typeConfig.label}) requires customer_id`,
      });
    }
    customer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customer_id);
    if (!customer)
      return res
        .status(404)
        .json({ error: `Customer with id ${customer_id} not found` });
  } else if (customer_id) {
    customer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customer_id);
  }

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
      vatExemptionCategory:
        vatCat === 7 ? item.vat_exemption_category || 7 : null,
      price: netValue,
      priceIncludeVAT: 0,
      quantity: item.quantity || 1,
      measurementUnit: 1,
      measurementUnitName: item.unit || "ΤΕΜ",
      incomeClassification: [
        {
          id: 1,
          classificationCategory:
            item.classification_category ||
            typeConfig.defaultClassificationCategory,
          classificationType:
            item.classification_type || typeConfig.defaultClassificationType,
          amount: netValue,
        },
      ],
    };
  });

  totalNetValue = parseFloat(totalNetValue.toFixed(2));
  totalVatAmount = parseFloat(totalVatAmount.toFixed(2));
  const totalGrossValue = parseFloat(
    (totalNetValue + totalVatAmount).toFixed(2),
  );

  const finalTransactionId =
    transaction_id || "POS-TRANS-" + Math.floor(Math.random() * 1000000);
  const finalTerminalId = String(terminal_id || "54888913");

  // --- Payload ---
  const payload = {
    invoice: [
      {
        B2G: null,
        ublFields: null,
        isUnsigned: true,

        issuer: {
          vatNumber: company.vat_number,
          branch: company.branch,
          country: company.country,
          name: null,
          address: null,
          countryDocumentId: null,
          documentIdNo: null,
          supplyAccountNo: null,
        },

        counterpart: customer
          ? {
              vatNumber: customer.vat_number,
              branch: customer.branch,
              country: customer.country,
              name: null,
              address: {
                city: customer.city,
                postalCode: customer.postal_code,
                street: customer.street || null,
                number: customer.street_number || null,
              },
              countryDocumentId: null,
              documentIdNo: null,
              supplyAccountNo: null,
            }
          : null,

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
          salerDoyCode: company.doy_code
            ? parseInt(company.doy_code, 10)
            : null,
          salerDoyName: company.doy_name,
          salerRepresentative: null,
          salerRepresentativeVat: null,
          salerAdditionalStreetName: null,

          customerName: customer?.display_name || null,
          customerVat: customer?.vat_number || null,
          customerCity: customer?.city || null,
          customerTk: customer?.postal_code
            ? String(customer.postal_code)
            : null,
          customerStreetName: customer?.street || null,
          customerEmail: customer?.email || null,
          customerPhone: customer?.phone || null,
          customerActivity: customer?.activity || null,
          customerDoyCode: customer?.doy_code
            ? parseInt(customer.doy_code, 10)
            : null,
          customerDoyName: customer?.doy_name || null,
          customerSendEmail: false,
          customerCode: null,
          altCustName: null,
          altCustAddress: null,

          invoiceTypeName: req.body.invoice_type_name || typeConfig.label,
          paymentMethodName: req.body.payment_method_name || "Κάρτα (POS)",

          // POS fields
          signature,
          nspCode: "01",
          transactionId: finalTransactionId,
          tipAmount: tip_amount ?? 0,

          vatExemptionCategoryName: null,
          vehicleNumber: null,
          movePurpose: null,
          nationalID: null,
          invoiceRemarks: req.body.remarks || null,
          loadingAddress: null,
          destinationAddress: null,
          hotelRoom: null,
          hotelStartDate: null,
          hotelEndDate: null,
        },

        invoiceHeader: {
          series: series || typeConfig.defaultSeries,
          aa,
          issueDate: issue_date,
          issueTime: issue_time || new Date().toTimeString().slice(0, 8),
          invoiceType: invoice_type,
          currency: "EUR",
          vatPaymentSuspension: false,
        },

        invoiceDetails,

        invoiceVatAnalysis: [
          {
            vatCategory: items[0].vat_category ?? 1,
            vatPercent:
              (VAT_RATES[items[0].vat_category ?? 1]?.rate ?? 0.24) * 100,
            netValuePerVat: totalNetValue,
            vatAmount: totalVatAmount,
          },
        ],

        invoiceSummary: {
          totalNetValue,
          totalVatAmount,
          totalGrossValue,
          totalPrintGrossValue: totalGrossValue,
          totalDeductionsAmount: 0,
          totalFeesAmount: 0,
          totalStampDutyAmount: 0,
          totalOtherTaxesAmount: 0,
          totalWithheldAmount: 0,
          incomeClassification: [
            {
              id: 1,
              classificationCategory:
                items[0].classification_category ||
                typeConfig.defaultClassificationCategory,
              classificationType:
                items[0].classification_type ||
                typeConfig.defaultClassificationType,
              amount: totalNetValue,
            },
          ],
        },

        paymentMethods: {
          paymentMethodDetails: [
            {
              type: payment_type || 8, // 8 = Κάρτα POS
              amount: totalGrossValue,
              tid: null,
              tipAmount: null,
              transactionId: null,
              providersSignature: null,
              ecrToken: null,
              paymentMethodInfo: null,
            },
          ],
        },

        tidNsp: finalTerminalId,
      },
    ],
  };

  try {
    const finalResponse = await bratnetApi.post("/sendSimInvoice", payload);
    const finalApiData = finalResponse.data;

    if (finalApiData?.response?.paroxosError) {
      return res.status(400).json({
        success: false,
        error_description: finalApiData.response.paroxosError.description,
        raw: finalApiData,
      });
    }
    if (finalApiData?.response?.errors?.length > 0) {
      return res.status(400).json({
        success: false,
        error_description: finalApiData.response.errors[0].message,
        raw: finalApiData,
      });
    }

    const result = finalApiData?.response?.responses?.[0];

    // Increment series counter on success
    try {
      const usedAaInt = parseInt(aa, 10);
      const usedSeries = series || typeConfig.defaultSeries;
      if (!isNaN(usedAaInt)) {
        db.prepare(
          "UPDATE series SET next_aa = ? WHERE name = ? AND invoice_type = ?"
        ).run(usedAaInt + 1, usedSeries, invoice_type);
      }
    } catch (e) {
      console.error("Failed to increment series counter:", e.message);
    }

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
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
