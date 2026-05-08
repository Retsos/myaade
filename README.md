# EpilogiB — e-Invoicing App

Εφαρμογή έκδοσης ηλεκτρονικών παραστατικών (Β2Β τιμολόγια & λιανικές αποδείξεις) με σύνδεση στο **myDATA της ΑΑΔΕ** μέσω του παρόχου **Bratnet (etimologiera)**.

Υποστηρίζονται:
- Έκδοση τιμολογίων χονδρικής (1.1, 2.1, 2.4, 5.1)
- Έκδοση αποδείξεων λιανικής (11.1, 11.2)
- Πληρωμή με **POS** (createSimSign + sendSimInvoice)
- Ετεροχρονισμένη πληρωμή B2B (createSign + updatePayments)
- Ιστορικό παραστατικών με φίλτρα (ΑΦΜ, MARK, ημερομηνίες) και pagination
- Διαχείριση πελατολογίου & σειρών παραστατικών

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
├── backend/        # Express API server (port 3000)
│   ├── routes/     # API endpoints
│   ├── db.js       # SQLite schema & migrations
│   ├── server.js   # Entry point
│   └── database.db # SQLite file (δημιουργείται αυτόματα)
├── frontend/       # React app (port 5173)
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── store/  # Zustand store
│       └── api.ts
└── index.html      # Visual flow documentation
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
PORT=3000
```

> **Σημείωση:** τα Bratnet credentials σου τα δίνει ο πάροχος. Χωρίς αυτά, οι κλήσεις στο myDATA θα αποτυγχάνουν αλλά το app θα τρέχει.
>
> Το `.env` είναι στο `.gitignore` οπότε **δεν** ανεβαίνει στο git. Το `.env.example` ανεβαίνει για να ξέρει ο επόμενος ποιες variables χρειάζεται.

### Στοιχεία εκδότη (issuer)

Το πρώτο record στον πίνακα `company` είναι **hardcoded** για την επιχείρηση που εκδίδει τα παραστατικά. Πριν την πρώτη χρήση χρειάζεται να βάλεις τα δικά σου στοιχεία (ΑΦΜ, ΔΟΥ, διεύθυνση κ.λπ.).

Άνοιξε τη βάση με κάποιο SQLite client (DB Browser for SQLite, sqlite3 CLI κ.λπ.) και τρέξε:

```sql
INSERT INTO company (
  id, name, title, vat_number, branch, country,
  doy_code, doy_name, city, postal_code, street, street_number,
  email, phone, website, gemh, activity
) VALUES (
  1, 'Η Επωνυμία μου', 'Διακριτικός Τίτλος', '123456789', 0, 'GR',
  '1101', 'Α΄ Αθηνών', 'Αθήνα', '10563', 'Ερμού', '12',
  'info@example.gr', '2101234567', 'https://example.gr', '000000000000', 'Δραστηριότητα'
);
```

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
   - Επίλεξε *Τιμολόγιο* (B2B) ή *Λιανική*
   - Επίλεξε σειρά (ΤΠΥ, ΑΛΠ, κ.λπ.)
   - Συμπλήρωσε ποσά
   - Διάλεξε τρόπο πληρωμής: Μετρητά / Εκκρεμές / POS
5. Στο **Ιστορικό** βλέπεις όλα τα εκδομένα παραστατικά, με φίλτρα και σύνολα ανά περίοδο

---

## API endpoints (συνοπτικά)

| Method | Endpoint | Σκοπός |
|---|---|---|
| GET | `/api/company` | Στοιχεία εκδότη |
| GET | `/api/customers` | Λίστα πελατών |
| POST | `/api/customers` | Νέος πελάτης |
| DELETE | `/api/customers/:id` | Διαγραφή πελάτη |
| GET | `/api/invoices` | Ιστορικό (filters: `vat`, `mark`, `from`, `to`, `page`, `limit`) |
| POST | `/api/invoices` | Αποθήκευση εγγραφής τοπικά |
| POST | `/api/invoices/:id/pay` | Ετεροχρονισμένη πληρωμή με POS |
| GET | `/api/series` | Λίστα σειρών |
| PUT | `/api/series/:id` | Ενημέρωση next_aa |
| POST | `/api/sendInvoice` | Έκδοση χωρίς POS |
| POST | `/api/sendSimInvoice` | Έκδοση με POS (απαιτεί signature) |
| POST | `/api/createSimSign` | Παραγωγή signature για νέο POS παραστατικό |
| POST | `/api/createSign` | Παραγωγή signature για ετεροχρονισμένη πληρωμή |
| GET | `/api/credits` | Υπόλοιπο credits Bratnet |

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

---

## Παραγωγή & Deployment

Για production deployment, αυτή η εφαρμογή χρειάζεται:
- HTTPS (απαιτείται από την ΑΑΔΕ για paragraf production endpoints)
- Authentication layer για τους χρήστες (τώρα δεν υπάρχει)
- Καλύτερο secrets management (όχι `.env` σε plain text)
- Backup strategy για το SQLite (ή migration σε managed DB)

Η εφαρμογή είναι σχεδιασμένη ως **εκπαιδευτικό project** σε συνεργασία με τη Bratnet — δεν προορίζεται για production χρήση χωρίς τις παραπάνω προσθήκες.
