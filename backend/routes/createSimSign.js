const express = require("express");
const router = express.Router();
const bratnetApi = require("../config");
const db = require("../db");

router.post("/createSimSign", async (req, res) => {
  try {
    const company = db.prepare("SELECT * FROM company WHERE id = 1").get();
    if (!company) {
      return res
        .status(500)
        .json({ error: "Δεν βρέθηκαν στοιχεία εταιρείας στη βάση." });
    }

    const {
      aa,
      issue_date,
      issue_time,
      series,
      invoice_type,
      net_value,
      vat_amount,
      total_value,
      nsp_code,
      terminal_id,
    } = req.body;

    const now = new Date();
    const finalTime = issue_time || now.toTimeString().slice(0, 8);

    // Το payload
    const payload = {
      companyBranch: company.branch || 0,
      issuerVatNumber: company.vat_number,
      externalSystemId: String(aa),
      invoiceIssueDate: issue_date,
      invoiceIssueTime: finalTime,
      invoiceSeries: series || "ΑΛΠ",
      invoiceType: invoice_type || "11.1",
      netValue: parseFloat(net_value),
      vatAmount: parseFloat(vat_amount),
      totalValue: parseFloat(total_value),
      paymentAmount: parseFloat(total_value),
      nspCode: nsp_code || "01",
      terminalId: String(terminal_id || "54888913"),
    };

    const response = await bratnetApi.post("/createSimSign", payload);

    return res.status(200).json({
      success: true,
      signature: response.data?.response?.hSignature,
      raw: response.data,
    });
  } catch (err) {
    console.error("createSimSign error:", err.response?.data || err.message);
    return res.status(400).json({
      success: false,
      error_description: "Αποτυχία παραγωγής SimSign.",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
