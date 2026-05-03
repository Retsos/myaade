const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.db");

const db = new Database(dbPath, { verbose: console.log });

db.pragma("foreign_keys = ON");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY,
    name TEXT,
    title TEXT,
    vat_number TEXT,
    branch INTEGER DEFAULT 0,
    country TEXT DEFAULT 'GR',
    doy_code TEXT,
    doy_name INTEGER,
    city TEXT,
    postal_code TEXT,
    street TEXT,
    street_number TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    gemh TEXT,
    activity TEXT
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_vat TEXT,
    invoice_type TEXT,
    series TEXT,
    aa TEXT,
    issue_date TEXT,
    total_net_value REAL,
    total_vat_amount REAL,
    total_gross_value REAL,
    mark TEXT,
    uid TEXT,
    invoice_url TEXT,
    status TEXT DEFAULT 'sent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

module.exports = db;
