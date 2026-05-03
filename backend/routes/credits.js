const express = require('express');
const router = express.Router();
const bratnetApi = require('../config');

router.get('/', async (req, res) => {
    try {
        const response = await bratnetApi.get('/getCreditInfo');
        res.status(200).json(response.data);
    } catch (error) {
        console.error("[Route: Credits] Σφάλμα:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Αποτυχία επικοινωνίας.' });
    }
});

module.exports = router;
