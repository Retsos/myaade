const express = require("express");
const router = express.Router();
const db = require("../db");
const bratnetApi = require("../config");

router.post("/:id/pay", async (req, res) => {
  const { pay_amount } = req.body;
  const invoiceId = req.params.id;

  if (!pay_amount || isNaN(pay_amount)) {
    return res.status(400).json({ error: "Το ποσό πληρωμής είναι υποχρεωτικό." });
  }

  try {
    const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId);

    if (!invoice) return res.status(404).json({ error: 'Δεν βρέθηκε το παραστατικό στη βάση.' });
    if (invoice.status === 'PAID') return res.status(400).json({ error: 'Αυτό το παραστατικό είναι ήδη εξοφλημένο.' });
    if (!invoice.uid) return res.status(400).json({ error: 'Δεν υπάρχει UID για να ταυτοποιηθεί το χρέος.' });
    if (parseFloat(pay_amount) < invoice.total_gross_value) {
      return res.status(400).json({ error: `Το ποσό δεν επαρκεί. Το συνολικό ποσό του παραστατικού είναι ${invoice.total_gross_value}€.` });
    }

    // Υπολογισμός φιλοδωρήματος (tipAmount) αν ο πελάτης έδωσε παραπάνω
    const payAmountFloat = parseFloat(pay_amount);
    const tipAmount = Math.max(0, parseFloat((payAmountFloat - invoice.total_gross_value).toFixed(2)));

    // Δημιουργία ενός 22-ψήφιου numeric transaction ID για τη συναλλαγή
    const dummyTransactionId = Array.from({ length: 22 }, () => Math.floor(Math.random() * 10)).join("");

    // --- ΒΗΜΑ 1: ΔΗΜΙΟΥΡΓΙΑ ΥΠΟΓΡΑΦΗΣ (createSign) ---
    // ΠΡΟΣΟΧΗ: Η Bratnet θέλει camelCase!
    const signPayload = {
      uid: invoice.uid,
      payAmount: payAmountFloat,
      nspCode: "01",
      tidNsp: "54888913"
    };
    
    const signRes = await bratnetApi.post('/createSign', signPayload);
    
    // ΑΝΙΧΝΕΥΤΗΣ ΚΡΥΦΟΥ ΣΦΑΛΜΑΤΟΣ ΣΤΟ SIGN
    if (signRes.data?.response?.paroxosError) {
      throw new Error(`[createSign] Η Bratnet παραπονιέται: ${signRes.data.response.paroxosError.description}`);
    }

    const hSignature = signRes.data?.response?.hSignature;
    if (!hSignature) {
      // Αν δεν έχει error αλλά δεν έχει και signature, κάτι πήγε εντελώς στραβά
      throw new Error(`[createSign] Άγνωστο σφάλμα: ${JSON.stringify(signRes.data)}`);
    }

    // --- ΒΗΜΑ 2: ΕΝΗΜΕΡΩΣΗ ΑΑΔΕ (updatePayments) ---
    const updatePayload = {
      hSignature: hSignature,
      paymentType: 8,
      tipAmount: tipAmount,
      transactionId: dummyTransactionId,
      uid: invoice.uid
    };

    const updateRes = await bratnetApi.post('/updatePayments', updatePayload);

    // ΑΝΙΧΝΕΥΤΗΣ ΚΡΥΦΟΥ ΣΦΑΛΜΑΤΟΣ ΣΤΟ UPDATE PAYMENTS
    if (updateRes.data?.response?.paroxosError) {
      throw new Error(`[updatePayments] Η Bratnet παραπονιέται: ${updateRes.data.response.paroxosError.description}`);
    }

    // --- ΒΗΜΑ 3: ΤΟΠΙΚΗ ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ ---
    db.prepare("UPDATE invoices SET status = 'PAID', payment_method = 'POS' WHERE id = ?").run(invoice.id);
    const paidInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);

    // Όλα τελείωσαν, το χρέος σβήστηκε επίσημα
    return res.status(200).json({ 
      success: true, 
      invoice: paidInvoice, 
      signature: hSignature 
    });

  } catch (err) {
    // Τώρα το error.message θα έχει τον ΑΚΡΙΒΗ λόγο που απέτυχε!
    console.error("Σφάλμα στην ολοκλήρωση πληρωμής:", err.message);
    return res.status(500).json({ 
      error: "Αποτυχία ενημέρωσης πληρωμής στο POS.",
      details: err.message 
    });
  }
});

module.exports = router;
