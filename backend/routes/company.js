const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/company - Fetch company details
router.get('/', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
