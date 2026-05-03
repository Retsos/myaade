require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const creditsRoute = require('./routes/credits');
const invoiceRoute = require('./routes/invoice');
const companyRoute = require('./routes/company');
const customersRoute = require('./routes/customers');
const invoicesRoute = require('./routes/invoices');

app.use('/api/credits', creditsRoute);
app.use('/api', invoiceRoute);
app.use('/api/company', companyRoute);
app.use('/api/customers', customersRoute);
app.use('/api/invoices', invoicesRoute);

app.listen(PORT, () => {
  console.log(`[SERVER] Ο διακομιστής τρέχει στη θύρα ${PORT}.`);
});
