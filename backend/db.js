require("dotenv").config();
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.db");

const db = new Database(dbPath);

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
`
).run();

// Συγχρονισμός vat_number του εκδότη με την env variable ISSUER_VAT
const issuerVat = process.env.ISSUER_VAT;
if (issuerVat) {
  const existing = db.prepare("SELECT id FROM company WHERE id = 1").get();
  if (existing) {
    db.prepare("UPDATE company SET vat_number = ? WHERE id = 1").run(issuerVat);
  } else {
    db.prepare("INSERT INTO company (id, vat_number) VALUES (1, ?)").run(issuerVat);
    console.warn(
      "[DB] Δημιουργήθηκε αρχικό company record με μόνο το ΑΦΜ. Πρόσθεσε τα υπόλοιπα στοιχεία (όνομα, ΔΟΥ, διεύθυνση...) χειροκίνητα.",
    );
  }
} else {
  console.warn(
    "[DB] ISSUER_VAT δεν έχει οριστεί στο .env — το vat_number θα διαβαστεί από τη βάση.",
  );
}

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
    status TEXT DEFAULT 'PENDING',
    payment_method TEXT DEFAULT 'NONE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`
).run();

// Migrate existing table to add payment_method if missing
try {
  db.prepare(`ALTER TABLE invoices ADD COLUMN payment_method TEXT DEFAULT 'NONE'`).run();
} catch (e) {
  // Column already exists
}

// Migration: add correlated_mark for credit notes (5.1).
// Stores the MARK of the original invoice that this credit note adjusts,
// so we can compute "how much of the original is still creditable" without
// hitting the AADE on every check.
try {
  db.prepare(`ALTER TABLE invoices ADD COLUMN correlated_mark TEXT`).run();
} catch (e) {
  // Column already exists
}

// Αν υπάρχει παλιό series table με διαφορετικό schema, drop & recreate
const existingSeriesCols = db.prepare("PRAGMA table_info(series)").all();
if (existingSeriesCols.length > 0) {
  const hasNextAa = existingSeriesCols.some((c) => c.name === "next_aa");
  const hasInvoiceType = existingSeriesCols.some((c) => c.name === "invoice_type");
  if (!hasNextAa || !hasInvoiceType) {
    db.prepare("DROP TABLE series").run();
  }
}

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    invoice_type TEXT NOT NULL,
    next_aa INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    UNIQUE(name, invoice_type)
  )
`
).run();

const SEED_SERIES = [
  { name: "ΤΠ",    invoice_type: "1.1",  description: "Τιμολόγιο Πώλησης" },
  { name: "ΤΔΑ",   invoice_type: "1.1",  description: "Τιμολόγιο - Δελτίο Αποστολής" },
  { name: "ΤΠΥ",   invoice_type: "2.1",  description: "Τιμολόγιο Παροχής Υπηρεσιών" },
  { name: "ΠΤ",    invoice_type: "5.1",  description: "Πιστωτικό Τιμολόγιο" },
  { name: "ΑΛΠ",   invoice_type: "11.1", description: "Απόδειξη Λιανικής Πώλησης" },
  { name: "ΑΠΥ",   invoice_type: "11.2", description: "Απόδειξη Παροχής Υπηρεσιών" },
];

const insertSeries = db.prepare(
  `INSERT OR IGNORE INTO series (name, invoice_type, next_aa, description) VALUES (?, ?, 1, ?)`
);
for (const s of SEED_SERIES) {
  insertSeries.run(s.name, s.invoice_type, s.description);
}

module.exports = db;
