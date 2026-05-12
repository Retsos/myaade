# EpilogiB — e-Invoicing App

Εφαρμογή έκδοσης ηλεκτρονικών παραστατικών (Β2Β τιμολόγια & λιανικές αποδείξεις) με σύνδεση στο **myDATA της ΑΑΔΕ** μέσω του παρόχου **Bratnet (etimologiera)**.

Υποστηρίζονται:

- Έκδοση τιμολογίων χονδρικής (1.1, 2.1, 2.4, 5.1)
- Έκδοση αποδείξεων λιανικής (11.1, 11.2)
- Πληρωμή με **POS** (createSimSign + sendSimInvoice)
- Ετεροχρονισμένη πληρωμή B2B (createSign + updatePayments)
- Auto-retry στο error **603** (AA already used) με αυτόματη ενημέρωση του counter
- Ιστορικό παραστατικών με φίλτρα (ΑΦΜ, MARK, ημερομηνίες), summary cards και pagination
- Διαχείριση πελατολογίου & σειρών παραστατικών
- Mobile-friendly UI (responsive sidebar, filter modal, card view για το ιστορικό)

---

## Τεχνολογίες

- **Frontend:** React 19 · TypeScript · Tailwind CSS · Vite · Zustand · React Router 7
- **Backend:** Node.js · Express 5 · better-sqlite3 · Axios
- **Database:** SQLite (local file)

---

## Προαπαιτούμενα

- **Node.js** ≥ 18
- **npm** (έρχεται μαζί με το Node)
- Credentials από τη **Bratnet** (etimologiera) για το myDATA API

---

## Δομή Project

```
epilogiB/
├── backend/                # Express API server (port 3000)
│   ├── routes/             # API endpoints (per resource)
│   ├── config.js           # Axios client για Bratnet
│   ├── db.js               # SQLite schema, migrations, seeds, ISSUER_VAT sync
│   ├── invoiceTypes.js     # myDATA invoice / payment / VAT catalogs
│   ├── server.js           # Entry point, route mounting
│   ├── .env.example        # Template για το .env (δεν περιέχει secrets)
│   └── database.db         # SQLite file (δημιουργείται αυτόματα)
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
│       └── api.ts          # Axios wrappers γύρω από το backend API
└── index.html              # Visual flow documentation
```

---

## 1. Κατέβασμα του project

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

Δημιούργησε ένα `.env` αντιγράφοντας το template:

```bash
cp .env.example .env
```

Άνοιξε το `.env` και βάλε τα δικά σου credentials. Τα keys που χρειάζονται:

```env
BRATNET_API_URL=https://api.etimologiera.gr
BRATNET_USERNAME=your_username_here
BRATNET_PASSWORD=your_password_here
ISSUER_VAT=your_vat_here
PORT=3000
```

> **Σημείωση:** τα Bratnet credentials σου τα δίνει ο πάροχος. Χωρίς αυτά, οι κλήσεις στο myDATA θα αποτυγχάνουν αλλά το app θα τρέχει.
>
> Το `ISSUER_VAT` είναι το ΑΦΜ της δικής σου επιχείρησης (του εκδότη). Σε κάθε εκκίνηση του server, το `vat_number` του company record συγχρονίζεται με αυτή την τιμή.
>
> Το `.env` είναι στο `.gitignore` οπότε **δεν** ανεβαίνει στο git. Το `.env.example` ανεβαίνει για να ξέρει ο επόμενος ποιες variables χρειάζεται.

### Στοιχεία εκδότη (issuer)

Το πρώτο record στον πίνακα `company` είναι τα στοιχεία της επιχείρησης που εκδίδει τα παραστατικά. Η φόρτωση γίνεται σε δύο βήματα:

**Βήμα 1:** Το ΑΦΜ έρχεται από το `.env` (`ISSUER_VAT`). Σε κάθε εκκίνηση του server, το `db.js` δημιουργεί / συγχρονίζει αυτόματα το `vat_number` του company record.

**Βήμα 2:** Τα υπόλοιπα στοιχεία (όνομα, ΔΟΥ, διεύθυνση κ.λπ.) χρειάζεται να τα βάλεις χειροκίνητα μία φορά. Άνοιξε τη βάση με κάποιο SQLite client (DB Browser for SQLite, sqlite3 CLI κ.λπ.) και τρέξε:

```sql
UPDATE company SET
  name           = 'Η Επωνυμία μου',
  title          = 'Διακριτικός Τίτλος',
  branch         = 0,
  country        = 'GR',
  doy_code       = '1101',
  doy_name       = 'Α΄ Αθηνών',
  city           = 'Αθήνα',
  postal_code    = '10563',
  street         = 'Ερμού',
  street_number  = '12',
  email          = 'info@example.gr',
  phone          = '2101234567',
  website        = 'https://example.gr',
  gemh           = '000000000000',
  activity       = 'Δραστηριότητα'
WHERE id = 1;
```

> Το `vat_number` δεν χρειάζεται να μπει εδώ — το διαχειρίζεται το `.env` και ξανασυγχρονίζεται σε κάθε boot.

### Εκκίνηση backend

```bash
npm run dev      # development με auto-reload (nodemon)
# ή
npm start        # production
```

Το API τρέχει στο **http://localhost:3000**.

---

## 3. Frontend setup

Σε νέο terminal:

```bash
cd frontend
npm install
npm run dev
```

Το app τρέχει στο **http://localhost:5173**.

### Build για production

```bash
npm run build      # παράγει dist/
npm run preview    # δοκιμή του build
```

---

## 4. Πρώτη χρήση

1. Άνοιξε το **http://localhost:5173**
2. Ελέγξε ότι το **Στοιχεία Επιχείρησης** εμφανίζει σωστά τα δικά σου δεδομένα
3. Πήγαινε στο **Πελατολόγιο** και πρόσθεσε τους πρώτους πελάτες
4. Στο **Ταμείο (POS)** μπορείς να εκδώσεις παραστατικά:
   - Επίλεξε _Τιμολόγιο_ (B2B) ή _Λιανική_
   - Επίλεξε σειρά (ΤΠΥ, ΑΛΠ, κ.λπ.) — ο ΑΑ γεμίζει αυτόματα από τη βάση
   - Συμπλήρωσε ποσά
   - Διάλεξε τρόπο πληρωμής: Μετρητά / Εκκρεμές (μόνο B2B) / POS
5. Στο **Ιστορικό** βλέπεις όλα τα εκδομένα παραστατικά:
   - Summary cards (Καθαρή, ΦΠΑ, Σύνολο) που ενημερώνονται live με τα φίλτρα
   - Auto-search καθώς πληκτρολογείς (debounced)
   - "Εκκρεμές" status φαίνεται **μόνο** σε B2B τιμολόγια με payment_method = NONE
   - POS κουμπί για εξόφληση εκκρεμών B2B

---

## API endpoints (συνοπτικά)

| Method | Endpoint                | Σκοπός                                                           |
| ------ | ----------------------- | ---------------------------------------------------------------- |
| GET    | `/api/company`          | Στοιχεία εκδότη                                                  |
| GET    | `/api/customers`        | Λίστα πελατών                                                    |
| POST   | `/api/customers`        | Νέος πελάτης                                                     |
| DELETE | `/api/customers/:id`    | Διαγραφή πελάτη                                                  |
| GET    | `/api/invoices`         | Ιστορικό (filters: `vat`, `mark`, `from`, `to`, `page`, `limit`) |
| POST   | `/api/invoices`         | Αποθήκευση εγγραφής τοπικά                                       |
| POST   | `/api/invoices/:id/pay` | Ετεροχρονισμένη πληρωμή B2B με POS                               |
| GET    | `/api/series`           | Λίστα σειρών                                                     |
| PUT    | `/api/series/:id`       | Ενημέρωση next_aa                                                |
| POST   | `/api/sendInvoice`      | Έκδοση χωρίς POS                                                 |
| POST   | `/api/sendSimInvoice`   | Έκδοση με POS (απαιτεί signature)                                |
| POST   | `/api/createSimSign`    | Παραγωγή signature για νέο POS παραστατικό                       |
| POST   | `/api/createSign`       | Παραγωγή signature για ετεροχρονισμένη πληρωμή                   |
| GET    | `/api/credits`          | Υπόλοιπο credits Bratnet                                         |

---

## Troubleshooting

**Πρόβλημα:** `BRATNET_API_URL is not defined`
→ Σιγουρέψου ότι υπάρχει το `.env` αρχείο στο `backend/` και έχεις κάνει restart το server.

**Πρόβλημα:** `database.db` corrupt ή schema mismatch
→ Σβήσε το αρχείο `backend/database.db` και ξανατρέξε `npm run dev`. Το schema θα ξαναδημιουργηθεί αυτόματα. **Προσοχή:** χάνεις όλα τα δεδομένα (πελάτες, παραστατικά).

**Πρόβλημα:** CORS errors στο frontend
→ Το backend χρησιμοποιεί `cors()` με default settings. Αν αλλάξεις port, σιγουρέψου ότι το `frontend/src/api.ts` δείχνει στο σωστό URL (`http://localhost:3000/api`).

**Πρόβλημα:** Bratnet API επιστρέφει 401
→ Λάθος credentials στο `.env`.

**Πρόβλημα:** AADE error **603 "Invoice already has been send"**
→ Σημαίνει ότι ο ΑΑ που δοκίμασες έχει ήδη χρησιμοποιηθεί στη ΑΑΔΕ. Το backend κάνει αυτόματα **έως 5 retries** αυξάνοντας το `next_aa` της σειράς, οπότε στις περισσότερες περιπτώσεις δουλεύει με μία προσπάθεια. Αν αποτύχουν και τα 5 retries (πολύ μεγάλο drift), ρύθμισε χειροκίνητα τη σειρά:
```sql
UPDATE series SET next_aa = <νέος_αριθμός> WHERE name = '<ΣΕΙΡΑ>' AND invoice_type = '<ΤΥΠΟΣ>';
```

---

## Παραγωγή & Deployment

Για production deployment, αυτή η εφαρμογή χρειάζεται:

- HTTPS (απαιτείται από την ΑΑΔΕ για paragraf production endpoints)
- Authentication layer για τους χρήστες (τώρα δεν υπάρχει)
- Καλύτερο secrets management (όχι `.env` σε plain text)
- Backup strategy για το SQLite (ή migration σε managed DB)

Η εφαρμογή είναι σχεδιασμένη ως **εκπαιδευτικό project** σε συνεργασία με τη Bratnet — δεν προορίζεται για production χρήση χωρίς τις παραπάνω προσθήκες.
