// One-off cleanup script: wipes the local invoices ledger and prunes any
// orphan series rows whose invoice_type is no longer supported.
//
// Use cases:
//   - Preparing a clean slate for a demo
//   - Removing test data after iterative development
//   - Cleaning up obsolete series after the supported-types list changes
//
// What it touches:
//   ✅ invoices table → all rows deleted
//   ✅ series table   → rows for unsupported invoice_types deleted
//                       (counters of supported series are preserved)
//
// What it leaves alone:
//   ❌ customers, company — kept intact
//
// Note on series counters: we intentionally DO NOT reset `series.next_aa`
// for supported series. The AADE test environment remembers every AA you've
// ever used, so going back to AA=1 would just hit error 603 immediately.
// The auto-retry in /sendInvoice will bump past any in-use AAs the first
// time you issue a new invoice anyway.
//
// Usage:
//   node backend/scripts/reset-invoices.js
//   npm run reset:invoices

const path = require("path");
const Database = require("better-sqlite3");

// Keep in sync with backend/invoiceTypes.js — any series row whose
// invoice_type isn't here will be considered obsolete and removed.
const SUPPORTED_TYPES = new Set(["1.1", "2.1", "5.1", "11.1", "11.2"]);

const dbPath = path.join(__dirname, "..", "database.db");
const db = new Database(dbPath);

// 1) Wipe invoices
const invoicesBefore = db
  .prepare("SELECT COUNT(*) AS cnt FROM invoices")
  .get().cnt;

if (invoicesBefore === 0) {
  console.log("[reset] Η invoices είναι ήδη άδεια — κανένα row για διαγραφή.");
} else {
  const invResult = db.prepare("DELETE FROM invoices").run();
  console.log(
    `[reset] Διαγράφηκαν ${invResult.changes} εγγραφές από το invoices table.`,
  );
}

// 2) Prune orphan series (whose invoice_type was removed from the codebase)
const allSeries = db.prepare("SELECT id, name, invoice_type FROM series").all();
const orphans = allSeries.filter((s) => !SUPPORTED_TYPES.has(s.invoice_type));

if (orphans.length === 0) {
  console.log("[reset] Όλες οι σειρές είναι valid — κανένα orphan για prune.");
} else {
  const deleteStmt = db.prepare("DELETE FROM series WHERE id = ?");
  for (const o of orphans) {
    deleteStmt.run(o.id);
    console.log(
      `[reset] Αφαιρέθηκε orphan σειρά: ${o.name} (invoice_type ${o.invoice_type})`,
    );
  }
}

console.log("[reset] customers / company δεν επηρεάστηκαν.");
console.log(
  "[reset] Στην επόμενη έκδοση παραστατικού, το auto-retry 603 θα προσπεράσει αυτόματα όσα AAs είναι κλεισμένα στην ΑΑΔΕ.",
);
