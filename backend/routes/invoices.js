const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  try {
    const { vat, from, to, mark } = req.query;
    const limitRaw = parseInt(req.query.limit, 10);
    const noLimit = limitRaw === 0;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = noLimit ? 0 : Math.min(200, Math.max(1, limitRaw || 20));
    const offset = noLimit ? 0 : (page - 1) * limit;

    const where = [];
    const params = [];

    if (vat) {
      where.push("customer_vat LIKE ?");
      params.push(`%${vat}%`);
    }
    if (mark) {
      where.push("mark LIKE ?");
      params.push(`%${mark}%`);
    }
    if (from) {
      where.push("issue_date >= ?");
      params.push(from);
    }
    if (to) {
      where.push("issue_date <= ?");
      params.push(to);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRow = db
      .prepare(`SELECT COUNT(*) AS cnt FROM invoices ${whereSql}`)
      .get(...params);
    const total = totalRow?.cnt || 0;

    const sumRow = db
      .prepare(
        `SELECT
           COALESCE(SUM(total_net_value),  0) AS net,
           COALESCE(SUM(total_vat_amount), 0) AS vat,
           COALESCE(SUM(total_gross_value),0) AS gross
         FROM invoices ${whereSql}`,
      )
      .get(...params);

    const invoices = noLimit
      ? db
          .prepare(
            `SELECT * FROM invoices ${whereSql}
             ORDER BY issue_date DESC, id DESC`,
          )
          .all(...params)
      : db
          .prepare(
            `SELECT * FROM invoices ${whereSql}
             ORDER BY issue_date DESC, id DESC
             LIMIT ? OFFSET ?`,
          )
          .all(...params, limit, offset);

    return res.status(200).json({
      success: true,
      invoices,
      total,
      totals: {
        net: sumRow?.net || 0,
        vat: sumRow?.vat || 0,
        gross: sumRow?.gross || 0,
      },
      page: noLimit ? 1 : page,
      limit: noLimit ? total : limit,
      totalPages: noLimit ? 1 : Math.max(1, Math.ceil(total / limit)),
    });
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

module.exports = router;
