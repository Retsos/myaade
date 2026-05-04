const express = require('express');
const router = express.Router();
const bratnetApi = require('../config');

router.post("/createSign", async (req, res) => {
  try {
    const { uid, pay_amount, nsp_code, terminal_id } = req.body;

    if (!uid || !pay_amount) {
      return res.status(400).json({ error: "Απαιτείται το UID του παραστατικού και το ποσό πληρωμής." });
    }

    const payload = {
      uid: String(uid),
      payAmount: parseFloat(pay_amount),
      nspCode: nsp_code || "01",
      tidNsp: String(terminal_id || "12345")
    };

    const response = await bratnetApi.post("/createSign", payload);

    return res.status(200).json({
      success: true,
      signature: response.data?.response?.responses?.[0]?.signatureMessage,
      raw: response.data
    });

  } catch (err) {
    console.error("createSign error:", err.response?.data || err.message);
    return res.status(400).json({
      success: false,
      error_description: "Αποτυχία παραγωγής Sign.",
      details: err.response?.data || err.message
    });
  }
});

module.exports = router;