const express = require("express");
const router = express.Router();
const db = require("../db");
const bratnetApi = require("../config");
const { INVOICE_TYPES, VAT_RATES } = require("../invoiceTypes");

router.post("/sendInvoice", async (req, res) => {
  const {
    customer_id,
    invoice_type,
    series,
    aa,
    issue_date,
    issue_time,
    items,
    payment_type,
  } = req.body;

  // --- 1. Validation ---
  if (!invoice_type || !aa || !issue_date || !items?.length) {
    return res.status(400).json({
      error: "Missing required fields: invoice_type, aa, issue_date, items",
    });
  }

  // --- 2. Ελέγχουμε αν ο τύπος παραστατικού υπάρχει στο config ---
  const typeConfig = INVOICE_TYPES[invoice_type];
  if (!typeConfig) {
    return res.status(400).json({
      error: `Unknown invoice_type: "${invoice_type}"`,
      available: Object.keys(INVOICE_TYPES),
    });
  }

  // --- 3. Αν ο τύπος χρειάζεται counterpart, customer_id είναι υποχρεωτικό ---
  if (typeConfig.requiresCounterpart && !customer_id) {
    return res.status(400).json({
      error: `invoice_type "${invoice_type}" (${typeConfig.label}) requires customer_id`,
    });
  }

  // --- 4. Issuer από DB ---
  const company = db.prepare("SELECT * FROM company WHERE id = 1").get();
  if (!company)
    return res.status(500).json({ error: "Company not found in DB" });

  // --- 5. Counterpart από DB (μόνο αν χρειάζεται) ---
  let customer = null;
  if (typeConfig.requiresCounterpart) {
    customer = db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(customer_id);
    if (!customer)
      return res
        .status(404)
        .json({ error: `Customer with id ${customer_id} not found` });
  }

  // --- 6. Υπολογισμοί γραμμών ---
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

  const now = new Date();
  const issueTime = issue_time || now.toTimeString().slice(0, 8);
  const invoiceSeries = series || typeConfig.defaultSeries;
  const paymentType = payment_type || typeConfig.defaultPaymentType;

  // --- 7. Payload (NON-POS) ---
  const payload = {
    invoice: [
      {
        B2G: null,
        ublFields: null,
        isUnsigned: typeConfig.isUnsigned,

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
          paymentMethodName:
            req.body.payment_method_name ||
            (paymentType === 3 ? "Μετρητά" : "Επί Πιστώσει"),
          nspCode: null,
          signature: null,
          tipAmount: null,
          transactionId: null,
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
          series: invoiceSeries,
          aa,
          issueDate: issue_date,
          issueTime,
          invoiceType: invoice_type,
          currency: "EUR",
          vatPaymentSuspension: false,
          correlatedInvoices: null,
          dispatchDate: null,
          dispatchTime: null,
          movePurpose: null,
          selfPricing: null,
          exchangeRate: null,
          tableAA: null,
          multipleConnectedMarks: null,
          otherCorrelatedEntities: null,
          otherDeliveryNoteHeader: null,
          otherMovePurposeTitle: null,
          pInvoiceNote: null,
          reverseDeliveryNote: null,
          reverseDeliveryNotePurpose: null,
          specialInvoiceCategory: null,
          thirdPartyCollection: null,
          toWeigh: null,
          totalCancelDeliveryOrders: null,
          vehicleNumber: null,
          fuelInvoice: null,
          invoiceVariationType: null,
          isDeliveryNote: null,
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
          expensesClassification: null,
        },

        paymentMethods: {
          paymentMethodDetails: [
            {
              type: paymentType,
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

        tidNsp: null,
        transmissionFailure: null,
        packingsDeclarations: null,
        taxesTotals: null,
        taxesDescriptions: null,
        invoiceTaxVatAnalysis: null,
        downloadingInvoiceUrl: null,
      },
    ],
  };

  // --- 8. Αποστολή ---
  try {
    const response = await bratnetApi.post("/sendInvoice", payload);
    const apiResponse = response.data;

    if (apiResponse?.response?.paroxosError) {
      const err = apiResponse.response.paroxosError;
      return res.status(400).json({
        success: false,
        error_code: err.code,
        error_description: err.description,
        invoice_url: err.invoiceUrl || null,
        raw: apiResponse,
      });
    }

    if (
      apiResponse?.response?.errors &&
      apiResponse.response.errors.length > 0
    ) {
      const aadeErr = apiResponse.response.errors[0];
      return res.status(400).json({
        success: false,
        error_code: aadeErr.code,
        error_description: aadeErr.message,
        raw: apiResponse,
      });
    }

    const result = apiResponse?.response?.responses?.[0];
    return res.status(200).json({
      success: true,
      invoice_mark: result?.invoiceMark,
      invoice_uid: result?.invoiceUid,
      invoice_url: result?.invoiceUrl,
      user_request_id: apiResponse.userRequestID,
      raw: apiResponse,
    });
  } catch (err) {
    console.error("Bratnet error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error_description: "Αποτυχία επικοινωνίας με το API της etimologiera.",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
