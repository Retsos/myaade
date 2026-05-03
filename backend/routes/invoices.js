const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
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
    invoice_url
  } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO invoices (
        customer_name, customer_vat, invoice_type, series, aa, issue_date,
        total_net_value, total_vat_amount, total_gross_value, mark, uid, invoice_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      invoice_url
    );

    const newInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/cancel', async (req, res) => {
  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'cancelled') {
      return res.json(invoice);
    }

    // TODO: Call /cancelSign or /cancelDeliveryNote with invoice.mark or
    // invoice.uid when the provider cancellation endpoint is implemented.

    db.prepare("UPDATE invoices SET status = 'cancelled' WHERE id = ?").run(invoice.id);
    const cancelledInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);

    res.json(cancelledInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
