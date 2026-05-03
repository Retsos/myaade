const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    vat_number TEXT NOT NULL,
    country TEXT DEFAULT 'GR',
    branch INTEGER DEFAULT 0,
    doy_code TEXT,
    doy_name TEXT,
    city TEXT,
    postal_code TEXT,
    street TEXT,
    street_number TEXT,
    email TEXT,
    phone TEXT,
    activity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

router.get('/', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY display_name ASC').all();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const {
    display_name,
    vat_number,
    country = 'GR',
    branch = 0,
    doy_code,
    doy_name,
    city,
    postal_code,
    street,
    street_number,
    email,
    phone,
    activity
  } = req.body;

  if (!display_name || !vat_number) {
    return res.status(400).json({ error: 'display_name and vat_number are required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO customers (
        display_name, vat_number, country, branch, doy_code, doy_name,
        city, postal_code, street, street_number, email, phone, activity
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      display_name,
      vat_number,
      country,
      branch,
      doy_code || null,
      doy_name || null,
      city || null,
      postal_code || null,
      street || null,
      street_number || null,
      email || null,
      phone || null,
      activity || null
    );

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
