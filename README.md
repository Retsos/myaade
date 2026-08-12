# myaade — open-source e-invoicing client for the Bratnet myDATA API

<img width="1917" height="837" alt="myaade" src="https://github.com/user-attachments/assets/92375d04-02ea-4563-9f97-ca0bea65153c" />

An end-to-end client for the Bratnet (etimologiera) provider API, through which businesses file documents with myDATA, the e-invoicing platform of Greece's Independent Authority for Public Revenue (AADE). Bratnet owns the conversation with AADE; this project owns everything on the customer's side of it. Both halves:

- **An integration layer (Express) that speaks the provider API — the POS and deferred-payment signature flows, the myDATA invoice / payment-method / VAT code catalogs, MARK correlation for credit notes, series and AA sequencing with recovery from rejections, and local persistence of everything issued.
- **A front end** (React) on top of it, so the whole thing is usable the day you clone it.

Built as an industry-partnered semester project at the International Hellenic University, in
collaboration with Bratnet, and released open source so their API customers can build their
own client instead of licensing one.

**Stack:** Express 5 · better-sqlite3 · Axios · React 19 · TypeScript · Vite · Tailwind · Zustand · React Router 7

---

## Scope

This is a **reference implementation**, and the boundary is deliberate.

**In scope** — the full path from a form submission to a document filed at AADE:

- Wholesale invoices (1.1 Sale, 2.1 Provision of Services)
- Retail receipts (11.1, 11.2)
- Credit invoices (5.1) with `correlatedInvoices` MARK linking and partial-credit tracking
- POS payments — `createSimSign` → `sendSimInvoice` signature flow
- Deferred B2B payments — `createSign` → `updatePayments`
- The myDATA code catalogs (invoice types, payment methods, VAT categories) mapped to
  something a cashier can actually pick from a dropdown
- Series & AA sequencing, including recovery from AADE rejection
- Invoice history with server-side filtering, pagination and live period totals
- Customer and series management, responsive down to a POS terminal screen


*Out of scope, on purpose** — everything that belongs to the integrating system:

| Not included | Why |
|---|---|
| User authentication / roles | Every integrator already has an identity system; baking one in would mean ripping it out |
| Secrets management | `.env` is correct for a local reference; production belongs in a vault, and that choice is infrastructure-specific |
| Managed database | SQLite keeps `git clone && npm i` working with zero setup. The data layer is isolated in `db.js` for exactly this reason |
| Multi-tenancy | One issuer per instance, matching the single-VAT `ISSUER_VAT` model |

Taking this to production? See the [production checklist](#production-checklist).


---

## Prerequisites

- **Node.js** ≥ 18
- **npm** (bundled with Node)
- Credentials from **Bratnet** (etimologiera) for the myDATA API

---

## Project Structure

```
epilogiB/
├── backend/                # Express API server (port 3000)
│   ├── routes/             # API endpoints (per resource)
│   ├── config.js           # Axios client for Bratnet
│   ├── db.js               # SQLite schema, migrations, seeds, ISSUER_VAT sync
│   ├── invoiceTypes.js     # myDATA invoice / payment / VAT catalogs
│   ├── server.js           # Entry point, route mounting
│   ├── .env.example        # Template for .env (does not contain secrets)
│   └── database.db         # SQLite file (created automatically)
├── frontend/               # React app (port 5173)
│   └── src/
│       ├── pages/          # Dashboard, Checkout, History, Customers, Company
│       ├── components/
│       │   ├── ui/         # Reusable: Button, Input, Select, Skeleton
│       │   ├── checkout/   # Checkout-specific subcomponents
│       │   ├── Layout.tsx  # Sidebar + main content shell
│       │   ├── Sidebar.tsx
│       │   └── Toast.tsx   # Auto-dismissing notification
│       ├── store/          # Zustand store (customers, series, company cache)
│       ├── types.ts
│       └── api.ts          # Axios wrappers around the backend API
└── index.html              # Visual flow documentation
```

---

## 1. Clone the project

```bash
git clone <repo-url>
cd epilogiB
```

---

## 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` by copying the template:

```bash
cp .env.example .env
```

Open the `.env` and add your credentials. The keys required:

```env
BRATNET_API_URL=https://api.etimologiera.gr
BRATNET_USERNAME=your_username_here
BRATNET_PASSWORD=your_password_here
ISSUER_VAT=your_vat_here
PORT=3000
```

> Note: The Bratnet credentials are provided by the provider. Without them, calls to myDATA will fail but the app will still run in a local/demo mode.
>
> The `ISSUER_VAT` is the VAT number (AFM) of your company (the issuer). On every server start the company record's vat_number is synchronized from this value.
>
> The `.env` is listed in `.gitignore` so it is **not** committed to git. The `.env.example` is committed so others know which variables are required.

### Issuer details (company)

The first record in the `company` table holds the details of the issuing company. Loading is done automatically on server start.

**Step 1:** The VAT comes from the `.env` (`ISSUER_VAT`). On each server boot `db.js` creates/synchronizes the company record using this VAT.

**Step 2:** The remaining fields (name, tax office, address, etc.) must be filled manually once. Open the DB and run an update like:

```sql
UPDATE company SET
  name           = 'My Company Name',
  title          = 'Trading Title',
  branch         = 0,
  country        = 'GR',
  doy_code       = '1101',
  doy_name       = 'A\' Athens',
  city           = 'Athens',
  postal_code    = '10563',
  street         = 'Ermou',
  street_number  = '12',
  email          = 'info@example.gr',
  phone          = '2101234567',
  website        = 'https://example.gr',
  gemh           = '000000000000',
  activity       = 'Activity'
WHERE id = 1;
```

> The `vat_number` does not need to be set here — it is managed from the `.env` and re-synced at boot.

### Start the backend

```bash
npm run dev      # development with auto-reload (nodemon)
# or
npm start        # production
```

The API runs at **http://localhost:3000**.

---

## 3. Frontend setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:5173**.

### Build for production

```bash
npm run build      # produces dist/
npm run preview    # test the build
```

---

## 4. First use

1. Open **http://localhost:5173**
2. Verify that the **Company Details** show your data correctly
3. Go to **Customers** and add the first customers
4. In **Checkout (POS)** you can issue documents:
   - Choose _Invoice_ (B2B) or _Retail_
   - Choose a series (TPY, ALP, etc.) — the AA is auto-filled from the DB
   - Fill amounts
   - Choose payment method: Cash / Pending (B2B only) / POS
5. In **History** you see all issued documents:
   - Summary cards (Net, VAT, Total) update live with filters
   - Auto-search while typing (debounced)
   - "Pending" status appears **only** for B2B invoices with payment_method = NONE
   - POS button to settle pending B2B invoices

### Issuing a credit invoice (5.1)

1. In **Checkout** choose _Invoice_ → series **PT**
2. Select the customer — the new "Related Document" card appears below
3. The searchable dropdown shows only the invoices of that customer
   - Fully credited documents appear disabled with the label "Fully credited"
   - Partially credited documents show a badge "Available €X"
4. Choose the original invoice you want to correct
5. Amount and reason are prefilled — reduce them if issuing a partial credit
6. Click the single **"Issue Credit"** button (red) — there's no payment method because credit invoices are not payment documents
7. The backend sends `correlatedInvoices: [MARK]` to AADE
8. In **History** the credit invoice is shown with a pink background, a "Credit" badge, negative amounts and status "Issued" — and related links to the original document

---

## API endpoints (summary)

| Method | Endpoint                | Purpose                                                           |
| ------ | ----------------------- | ----------------------------------------------------------------- |
| GET    | `/api/company`          | Company details                                                    |
| GET    | `/api/customers`        | Customer list                                                      |
| POST   | `/api/customers`        | New customer                                                       |
| DELETE | `/api/customers/:id`    | Delete customer                                                    |
| GET    | `/api/invoices`         | History (filters: `vat`, `mark`, `from`, `to`, `page`, `limit`)   |
| POST   | `/api/invoices`         | Save record locally                                                |
| POST   | `/api/invoices/:id/pay` | Deferred B2B payment via POS                                       |
| GET    | `/api/series`           | Series list                                                        |
| PUT    | `/api/series/:id`       | Update next_aa                                                      |
| POST   | `/api/sendInvoice`      | Issue without POS                                                   |
| POST   | `/api/sendSimInvoice`   | Issue with POS (requires signature)                                 |
| POST   | `/api/createSimSign`    | Produce signature for a new POS document                            |
| POST   | `/api/createSign`       | Produce signature for deferred payment                              |
| GET    | `/api/credits`          | Bratnet credits balance                                              |

---

## Troubleshooting

**Issue:** `BRATNET_API_URL is not defined`  
→ Make sure the `.env` file exists in `backend/` and you've restarted the server.

**Issue:** `database.db` corrupt or schema mismatch  
→ Delete `backend/database.db` and rerun `npm run dev`. The schema will be recreated automatically. WARNING: you will lose all local data.

**Issue:** CORS errors in the frontend  
→ The backend uses `cors()` with default settings. If you change ports, make sure `frontend/src/api.ts` points to the correct backend URL.

**Issue:** Bratnet API returns 401  
→ Wrong credentials in `.env`.

**Issue:** AADE error **603 "Invoice already has been send"**  
→ Means the AA that you tried to use has already been sent to AADE. The backend automatically retries up to 5 times while incrementing the counter. If you need to manually fix the series counter:

```sql
UPDATE series SET next_aa = <new_number> WHERE name = '<SERIES>' AND invoice_type = '<TYPE>';
```

---


## Using the app

1. Check that **Company Details** shows your issuer data
2. Add customers under **Customers**
3. **Checkout (POS)** — pick Invoice (B2B) or Retail, pick a series (the AA auto-fills from
   the DB), enter amounts, choose Cash / Pending (B2B only) / POS
4. **History** — live summary cards (Net, VAT, Total) that follow the active filters,
   debounced search, and a "Pending" badge on unsettled B2B invoices with a POS button to
   settle them


---

## Production checklist

To take this beyond a reference implementation:

- [ ] **HTTPS** — required by AADE production endpoints
- [ ] **Authentication & authorization** — no user layer exists, by design
- [ ] **Secrets management** — move Bratnet credentials out of plain-text `.env`
- [ ] **Durable storage** — migrate off local SQLite, or add a backup strategy. The data
      layer is isolated in `db.js` to keep this a contained change
- [ ] **Idempotency keys on issuance** — closes the timeout window that causes 603 drift in
      the first place
- [ ] **Structured logging on every AADE call** — you will need the audit trail

---

## License

MIT 

