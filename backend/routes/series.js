const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/series  ή  GET /api/series?invoice_type=11.1
router.get("/", (req, res) => {
  try {
    const { invoice_type } = req.query;
    let rows;
    if (invoice_type) {
      rows = db
        .prepare("SELECT * FROM series WHERE invoice_type = ? ORDER BY name")
        .all(invoice_type);
    } else {
      rows = db
        .prepare("SELECT * FROM series ORDER BY invoice_type, name")
        .all();
    }
    res.json({ success: true, series: rows });
  } catch (err) {
    console.error("GET /series error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/series/:id  — μόνο next_aa αλλάζει
router.put("/:id", (req, res) => {
  try {
    const { next_aa } = req.body;
    const id = parseInt(req.params.id, 10);

    if (next_aa === undefined || next_aa === null || isNaN(parseInt(next_aa, 10))) {
      return res.status(400).json({ error: "Το next_aa είναι υποχρεωτικό και πρέπει να είναι αριθμός." });
    }
    const value = parseInt(next_aa, 10);
    if (value < 1) {
      return res.status(400).json({ error: "Το next_aa πρέπει να είναι >= 1." });
    }

    const result = db.prepare("UPDATE series SET next_aa = ? WHERE id = ?").run(value, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Η σειρά δεν βρέθηκε." });
    }
    const row = db.prepare("SELECT * FROM series WHERE id = ?").get(id);
    res.json({ success: true, series: row });
  } catch (err) {
    console.error("PUT /series/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
