const express = require("express");
const router = express.Router();
const db = require("../db");
const bratnetApi = require("../config");

router.get("/", (req, res) => {
  try {
    const invoices = db
      .prepare("SELECT * FROM invoices ORDER BY issue_date DESC, id DESC")
      .all();
    return res.status(200).json({ success: true, invoices });
  } catch (err) {
    console.error("Σφάλμα ανάγνωσης τεφτεριού:", err);
    return res
      .status(500)
      .json({ success: false, error: "Αποτυχία φόρτωσης ιστορικού." });
  }
});

router.post("/", (req, res) => {
  const {
    customer_name,
    customer_vat,
    invoice_type,
    series,
    aa,
    issue_date,
    total_net_value,
    total_vat_amount,
    total_gross_value,
    mark,
    uid,
    invoice_url,
  } = req.body;

  let status = req.body.status;
  let payment_method = req.body.payment_method;

  if (!status || !payment_method) {
    if (invoice_type === "11.1") {
      status = "PAID";
      payment_method = "POS";
    } else {
      status = "PENDING";
      payment_method = "NONE";
    }
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO invoices (
        customer_name, customer_vat, invoice_type, series, aa, issue_date,
        total_net_value, total_vat_amount, total_gross_value, mark, uid, invoice_url, status, payment_method
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      customer_name,
      customer_vat,
      invoice_type,
      series,
      aa,
      issue_date,
      total_net_value,
      total_vat_amount,
      total_gross_value,
      mark,
      uid,
      invoice_url,
      status,
      payment_method,
    );

    const newInvoice = db
      .prepare("SELECT * FROM invoices WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  try {
    const invoice = db
      .prepare("SELECT * FROM invoices WHERE id = ?")
      .get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (invoice.status === "cancelled") {
      return res.json(invoice);
    }

    // TODO: Call /cancelSign or /cancelDeliveryNote with invoice.mark or
    // invoice.uid when the provider cancellation endpoint is implemented.

    db.prepare("UPDATE invoices SET status = 'cancelled' WHERE id = ?").run(
      invoice.id,
    );
    const cancelledInvoice = db
      .prepare("SELECT * FROM invoices WHERE id = ?")
      .get(invoice.id);

    res.json(cancelledInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
