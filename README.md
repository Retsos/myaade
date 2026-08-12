# myaade — e-Invoicing App

An application for issuing electronic documents (B2B invoices & retail receipts) with integration to the myDATA service of the Independent Authority for Public Revenue (AADE).

<img width="1917" height="837" alt="myaade" src="https://github.com/user-attachments/assets/92375d04-02ea-4563-9f97-ca0bea65153c" />

Scope

This is a reference implementation, and the boundary is deliberate.

In scope — the full path from a form submission to a document filed at AADE:

- Issue wholesale invoices (1.1 Sale, 2.1 Provision of Services)
- Issue **credit invoices** (5.1) referencing the original MARK
- Issue retail receipts (11.1, 11.2)
- Payment with **POS** (createSimSign + sendSimInvoice)
- Deferred B2B payment (createSign + updatePayments)
- Auto-retry on AADE error **603** (AA already used) with automatic counter update
- Invoice history with filters (VAT, MARK, dates), summary cards and pagination
- Customer & series management
- Mobile-friendly UI (responsive sidebar, filter modal, card view for history)

---

## Technologies

- **Frontend:** React 19 · TypeScript · Tailwind CSS · Vite · Zustand · React Router 7
- **Backend:** Node.js · Express 5 · better-sqlite3 · Axios
- **Database:** SQLite (local file)

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

## Production & Deployment

For production deployment, this application requires:

- HTTPS (required by AADE production endpoints)
- An authentication layer for users (none exists at the moment)
- Better secrets management (avoid plain-text `.env`)
- A backup strategy for SQLite (or migrate to a managed DB)

- Context & license

Built as an industry-partnered semester project at the International Hellenic University, in collaboration with Bratnet, and released open source so their API customers can build their own interface instead of licensing one.

LICENSE - MIT
