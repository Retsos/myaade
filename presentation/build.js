const PptxGenJS = require("pptxgenjs");

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches

// ── Color palette (matches app theme) ──────────────────────────────────────
const COLORS = {
  bg: "0F172A",        // slate-900
  bgAlt: "0B1220",     // deeper slate for accent panels
  surface: "1E293B",   // slate-800
  surface2: "111827",  // slate-850-ish
  border: "334155",    // slate-700
  text: "F1F5F9",      // slate-100
  textMuted: "94A3B8", // slate-400
  textDim: "64748B",   // slate-500
  brand: "3B82F6",     // blue-500
  brandLight: "60A5FA",// blue-400
  brandDim: "1E3A8A",  // blue-900
  emerald: "10B981",
  amber: "F59E0B",
  rose: "F43F5E",
};

const FONT_HEADER = "Calibri";
const FONT_BODY = "Calibri";

// Helper to add a base dark slide
function addBase(title) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bg };
  if (title) {
    // small brand accent dot
    slide.addShape("ellipse", {
      x: 0.6, y: 0.6, w: 0.15, h: 0.15, fill: { color: COLORS.brand },
      line: { color: COLORS.brand },
    });
    slide.addText(title, {
      x: 0.85, y: 0.45, w: 11.5, h: 0.5,
      fontFace: FONT_HEADER, fontSize: 24, bold: true, color: COLORS.text,
    });
  }
  // bottom-right footer
  slide.addText("myAade App · 2025", {
    x: 10.5, y: 7.1, w: 2.6, h: 0.3,
    fontFace: FONT_BODY, fontSize: 9, color: COLORS.textDim, align: "right",
  });
  return slide;
}

// ────────────────────────────────────────────────────────────────────────────
// Slide 1 — Title
// ────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bg };

  // accent diagonal stripe on right
  slide.addShape("rect", {
    x: 9.5, y: 0, w: 3.83, h: 7.5, fill: { color: COLORS.bgAlt }, line: { color: COLORS.bgAlt },
  });
  // brand accent block
  slide.addShape("rect", {
    x: 9.5, y: 0, w: 0.12, h: 7.5, fill: { color: COLORS.brand }, line: { color: COLORS.brand },
  });

  // small brand dot
  slide.addShape("ellipse", {
    x: 0.7, y: 2.4, w: 0.4, h: 0.4, fill: { color: COLORS.brand }, line: { color: COLORS.brand },
  });

  // Title
  slide.addText("myAade App", {
    x: 0.7, y: 2.9, w: 9, h: 1.4,
    fontFace: FONT_HEADER, fontSize: 72, bold: true, color: COLORS.text,
  });

  // Subtitle
  slide.addText("Ηλεκτρονική Τιμολόγηση μέσω myDATA ΑΑΔΕ", {
    x: 0.7, y: 4.2, w: 9, h: 0.6,
    fontFace: FONT_BODY, fontSize: 24, color: COLORS.brandLight,
  });

  slide.addText("Σε συνεργασία με Bratnet (etimologiera)", {
    x: 0.7, y: 4.8, w: 9, h: 0.4,
    fontFace: FONT_BODY, fontSize: 16, color: COLORS.textMuted, italic: true,
  });

  // Author block bottom-left
  slide.addShape("rect", {
    x: 0.7, y: 6.0, w: 0.04, h: 0.9, fill: { color: COLORS.brand }, line: { color: COLORS.brand },
  });
  slide.addText(
    [
      { text: "Ρετσιλάς Γεώργιος\n", options: { fontSize: 16, bold: true, color: COLORS.text } },
      { text: "Α.Μ. 2022143\n", options: { fontSize: 12, color: COLORS.textMuted } },
      { text: "Ελεύθερη Επιλογή · 8ο Εξάμηνο", options: { fontSize: 12, color: COLORS.textMuted } },
    ],
    { x: 0.95, y: 5.95, w: 6, h: 1.1, fontFace: FONT_BODY, valign: "top" },
  );

  // Vertical text on the right panel
  slide.addText("PRESENTATION", {
    x: 9.8, y: 0.6, w: 3.5, h: 0.4,
    fontFace: FONT_HEADER, fontSize: 11, color: COLORS.textDim, charSpacing: 8,
  });
  slide.addText("01", {
    x: 9.8, y: 6.5, w: 3.5, h: 0.5,
    fontFace: FONT_HEADER, fontSize: 14, color: COLORS.textDim, bold: true,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Slide 2 — Problem / Context
// ────────────────────────────────────────────────────────────────────────────
{
  const slide = addBase("Το πρόβλημα");

  // Left column - big stat / context
  slide.addShape("rect", {
    x: 0.6, y: 1.5, w: 5.5, h: 5.2,
    fill: { color: COLORS.surface }, line: { color: COLORS.border, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText("100%", {
    x: 0.8, y: 1.8, w: 5, h: 1.5,
    fontFace: FONT_HEADER, fontSize: 100, bold: true, color: COLORS.brand,
  });
  slide.addText("των παραστατικών στην Ελλάδα πρέπει να υποβάλλονται στο myDATA της ΑΑΔΕ", {
    x: 0.8, y: 3.4, w: 5.1, h: 1.6,
    fontFace: FONT_BODY, fontSize: 18, color: COLORS.text, valign: "top",
  });
  slide.addText("Νομική απαίτηση από 2021 · Καθημερινή ανάγκη για κάθε επιχείρηση", {
    x: 0.8, y: 5.5, w: 5.1, h: 1,
    fontFace: FONT_BODY, fontSize: 12, italic: true, color: COLORS.textMuted, valign: "top",
  });

  // Right column - complexity bullets
  slide.addText("Τι το κάνει δύσκολο;", {
    x: 6.5, y: 1.5, w: 6.3, h: 0.5,
    fontFace: FONT_HEADER, fontSize: 18, bold: true, color: COLORS.brandLight,
  });

  const challenges = [
    { num: "5+", label: "διαφορετικοί τύποι παραστατικών (1.1, 2.1, 5.1, 11.1, 11.2)" },
    { num: "POS", label: "διαφορετικό flow με digital signature (createSimSign)" },
    { num: "Live", label: "πληρωμές B2B με ετεροχρονισμένη εξόφληση" },
    { num: "JSON", label: "σύνθετα payloads · 100+ πεδία ανά παραστατικό" },
  ];

  challenges.forEach((c, i) => {
    const y = 2.1 + i * 1.05;
    // small badge
    slide.addShape("rect", {
      x: 6.5, y: y, w: 0.9, h: 0.7,
      fill: { color: COLORS.brandDim }, line: { color: COLORS.brand, width: 1 },
      rectRadius: 0.08,
    });
    slide.addText(c.num, {
      x: 6.5, y: y, w: 0.9, h: 0.7,
      fontFace: FONT_HEADER, fontSize: 13, bold: true,
      color: COLORS.brandLight, align: "center", valign: "middle",
    });
    slide.addText(c.label, {
      x: 7.6, y: y, w: 5.2, h: 0.7,
      fontFace: FONT_BODY, fontSize: 13, color: COLORS.text, valign: "middle",
    });
  });

  slide.addText("02", {
    x: 12.3, y: 7.1, w: 0.5, h: 0.3,
    fontFace: FONT_HEADER, fontSize: 10, color: COLORS.textDim, align: "right",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Slide 3 — Architecture
// ────────────────────────────────────────────────────────────────────────────
{
  const slide = addBase("Αρχιτεκτονική");

  // Four boxes connected with arrows
  const boxW = 2.5;
  const boxH = 1.6;
  const y = 2.5;
  const startX = 0.6;
  const gap = 0.55;

  const boxes = [
    { label: "React UI", sub: "Frontend\nport 5173", color: COLORS.brand },
    { label: "Express API", sub: "Backend\nport 3000", color: COLORS.brand },
    { label: "Bratnet API", sub: "etimologiera", color: COLORS.emerald },
    { label: "AADE myDATA", sub: "Greek Tax\nAuthority", color: COLORS.amber },
  ];

  boxes.forEach((b, i) => {
    const x = startX + i * (boxW + gap);
    slide.addShape("rect", {
      x, y, w: boxW, h: boxH,
      fill: { color: COLORS.surface }, line: { color: b.color, width: 2 },
      rectRadius: 0.1,
    });
    // colored top stripe
    slide.addShape("rect", {
      x, y, w: boxW, h: 0.08,
      fill: { color: b.color }, line: { color: b.color },
    });
    slide.addText(b.label, {
      x: x + 0.1, y: y + 0.3, w: boxW - 0.2, h: 0.5,
      fontFace: FONT_HEADER, fontSize: 18, bold: true, color: COLORS.text,
      align: "center",
    });
    slide.addText(b.sub, {
      x: x + 0.1, y: y + 0.85, w: boxW - 0.2, h: 0.7,
      fontFace: FONT_BODY, fontSize: 11, color: COLORS.textMuted,
      align: "center",
    });

    if (i < boxes.length - 1) {
      const arrowX = x + boxW + 0.06;
      slide.addShape("rightTriangle", {
        x: arrowX, y: y + boxH / 2 - 0.15, w: 0.4, h: 0.3,
        fill: { color: COLORS.brand }, line: { color: COLORS.brand },
        rotate: 0,
      });
    }
  });

  // SQLite below
  slide.addShape("rect", {
    x: 1.4, y: 5.0, w: 4, h: 1.3,
    fill: { color: COLORS.surface2 }, line: { color: COLORS.border, width: 1, dashType: "dash" },
    rectRadius: 0.1,
  });
  slide.addText("SQLite (local audit)", {
    x: 1.4, y: 5.1, w: 4, h: 0.5,
    fontFace: FONT_HEADER, fontSize: 16, bold: true, color: COLORS.text, align: "center",
  });
  slide.addText("Snapshot κάθε παραστατικού + series counters + customer cache", {
    x: 1.4, y: 5.6, w: 4, h: 0.7,
    fontFace: FONT_BODY, fontSize: 11, color: COLORS.textMuted, align: "center", valign: "top",
  });

  // Connection line from Express to SQLite
  slide.addShape("line", {
    x: 4.1, y: 4.1, w: 0, h: 0.9,
    line: { color: COLORS.brand, width: 2, dashType: "dash" },
  });

  // Right side - key principles
  slide.addText("Σχεδιαστικές αρχές", {
    x: 7, y: 4.9, w: 5.7, h: 0.4,
    fontFace: FONT_HEADER, fontSize: 14, bold: true, color: COLORS.brandLight,
  });
  const principles = [
    "env → DB sync μία φορά στο boot (single source of truth)",
    "Zustand cache για customers / series / company",
    "Auto-retry στο AADE error 603 (έως 5 προσπάθειες)",
  ];
  principles.forEach((p, i) => {
    slide.addText(`▸  ${p}`, {
      x: 7, y: 5.35 + i * 0.4, w: 5.8, h: 0.4,
      fontFace: FONT_BODY, fontSize: 12, color: COLORS.text,
    });
  });

  slide.addText("03", {
    x: 12.3, y: 7.1, w: 0.5, h: 0.3,
    fontFace: FONT_HEADER, fontSize: 10, color: COLORS.textDim, align: "right",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Slide 4 — Features
// ────────────────────────────────────────────────────────────────────────────
{
  const slide = addBase("Τι υποστηρίζει");

  const features = [
    {
      title: "Τιμολόγια Χονδρικής",
      sub: "B2B · Τύποι 1.1 · 2.1",
      desc: "Με ή χωρίς POS · Επί πιστώσει · Μετρητά",
      color: COLORS.brand,
    },
    {
      title: "Πιστωτικά Τιμολόγια",
      sub: "Τύπος 5.1 · με correlatedInvoices",
      desc: "Searchable picker αρχικού · auto-fill ποσού/πελάτη",
      color: COLORS.rose,
    },
    {
      title: "Αποδείξεις Λιανικής",
      sub: "Retail · Τύποι 11.1 · 11.2",
      desc: "Πάντα με ταυτόχρονη πληρωμή",
      color: COLORS.emerald,
    },
    {
      title: "POS Signature",
      sub: "createSimSign → sendSimInvoice",
      desc: "Digital signature για πληρωμή με κάρτα",
      color: COLORS.amber,
    },
    {
      title: "Ετεροχρονισμένη Πληρωμή",
      sub: "createSign → updatePayments",
      desc: "Εξόφληση εκκρεμών B2B μέσω POS",
      color: COLORS.brandLight,
    },
    {
      title: "Ιστορικό · Mobile UI",
      sub: "Φίλτρα ΑΦΜ / MARK / Ημερομηνίες",
      desc: "Pagination + σύνολα + responsive cards",
      color: COLORS.brand,
    },
  ];

  // 2x3 grid
  const cardW = 4.0;
  const cardH = 2.4;
  const startX = 0.6;
  const startY = 1.4;
  const gapX = 0.15;
  const gapY = 0.2;

  features.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    slide.addShape("rect", {
      x, y, w: cardW, h: cardH,
      fill: { color: COLORS.surface }, line: { color: COLORS.border, width: 1 },
      rectRadius: 0.1,
    });
    // left accent bar
    slide.addShape("rect", {
      x, y, w: 0.08, h: cardH,
      fill: { color: f.color }, line: { color: f.color },
    });
    slide.addText(f.title, {
      x: x + 0.3, y: y + 0.25, w: cardW - 0.4, h: 0.5,
      fontFace: FONT_HEADER, fontSize: 16, bold: true, color: COLORS.text,
    });
    slide.addText(f.sub, {
      x: x + 0.3, y: y + 0.85, w: cardW - 0.4, h: 0.45,
      fontFace: FONT_BODY, fontSize: 11, color: f.color, italic: true,
    });
    slide.addText(f.desc, {
      x: x + 0.3, y: y + 1.4, w: cardW - 0.4, h: 0.9,
      fontFace: FONT_BODY, fontSize: 12, color: COLORS.textMuted, valign: "top",
    });
  });

  slide.addText("04", {
    x: 12.3, y: 7.1, w: 0.5, h: 0.3,
    fontFace: FONT_HEADER, fontSize: 10, color: COLORS.textDim, align: "right",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Slide 5 — Tech Stack
// ────────────────────────────────────────────────────────────────────────────
{
  const slide = addBase("Τεχνολογίες");

  // Two columns
  const colW = 5.8;
  const colH = 5.3;
  const startY = 1.5;

  // Frontend column
  slide.addShape("rect", {
    x: 0.6, y: startY, w: colW, h: colH,
    fill: { color: COLORS.surface }, line: { color: COLORS.brand, width: 2 },
    rectRadius: 0.12,
  });
  slide.addShape("rect", {
    x: 0.6, y: startY, w: colW, h: 0.08,
    fill: { color: COLORS.brand }, line: { color: COLORS.brand },
  });
  slide.addText("FRONTEND", {
    x: 0.85, y: startY + 0.3, w: colW - 0.5, h: 0.4,
    fontFace: FONT_HEADER, fontSize: 12, color: COLORS.brandLight, charSpacing: 6,
  });
  slide.addText("React + TypeScript SPA", {
    x: 0.85, y: startY + 0.7, w: colW - 0.5, h: 0.6,
    fontFace: FONT_HEADER, fontSize: 22, bold: true, color: COLORS.text,
  });

  const fe = [
    { name: "React 19", desc: "UI framework" },
    { name: "TypeScript", desc: "Type-safe codebase" },
    { name: "Tailwind CSS", desc: "Utility-first styling" },
    { name: "Vite", desc: "Build & dev server" },
    { name: "Zustand", desc: "Lightweight state cache" },
    { name: "React Router 7", desc: "Client routing" },
  ];
  fe.forEach((t, i) => {
    const y = startY + 1.5 + i * 0.55;
    slide.addShape("ellipse", {
      x: 0.95, y: y + 0.1, w: 0.18, h: 0.18,
      fill: { color: COLORS.brand }, line: { color: COLORS.brand },
    });
    slide.addText(t.name, {
      x: 1.3, y: y, w: 2.5, h: 0.4,
      fontFace: FONT_HEADER, fontSize: 14, bold: true, color: COLORS.text,
    });
    slide.addText(t.desc, {
      x: 3.6, y: y, w: 2.6, h: 0.4,
      fontFace: FONT_BODY, fontSize: 11, color: COLORS.textMuted, italic: true,
    });
  });

  // Backend column
  slide.addShape("rect", {
    x: 6.9, y: startY, w: colW, h: colH,
    fill: { color: COLORS.surface }, line: { color: COLORS.emerald, width: 2 },
    rectRadius: 0.12,
  });
  slide.addShape("rect", {
    x: 6.9, y: startY, w: colW, h: 0.08,
    fill: { color: COLORS.emerald }, line: { color: COLORS.emerald },
  });
  slide.addText("BACKEND", {
    x: 7.15, y: startY + 0.3, w: colW - 0.5, h: 0.4,
    fontFace: FONT_HEADER, fontSize: 12, color: COLORS.emerald, charSpacing: 6,
  });
  slide.addText("Node.js REST API", {
    x: 7.15, y: startY + 0.7, w: colW - 0.5, h: 0.6,
    fontFace: FONT_HEADER, fontSize: 22, bold: true, color: COLORS.text,
  });

  const be = [
    { name: "Node.js 18+", desc: "Runtime" },
    { name: "Express 5", desc: "HTTP framework" },
    { name: "better-sqlite3", desc: "Embedded SQL DB" },
    { name: "Axios", desc: "HTTP client to Bratnet" },
    { name: "dotenv", desc: "Env-based config" },
    { name: "nodemon", desc: "Dev auto-reload" },
  ];
  be.forEach((t, i) => {
    const y = startY + 1.5 + i * 0.55;
    slide.addShape("ellipse", {
      x: 7.25, y: y + 0.1, w: 0.18, h: 0.18,
      fill: { color: COLORS.emerald }, line: { color: COLORS.emerald },
    });
    slide.addText(t.name, {
      x: 7.6, y: y, w: 2.5, h: 0.4,
      fontFace: FONT_HEADER, fontSize: 14, bold: true, color: COLORS.text,
    });
    slide.addText(t.desc, {
      x: 9.9, y: y, w: 2.6, h: 0.4,
      fontFace: FONT_BODY, fontSize: 11, color: COLORS.textMuted, italic: true,
    });
  });

  slide.addText("05", {
    x: 12.3, y: 7.1, w: 0.5, h: 0.3,
    fontFace: FONT_HEADER, fontSize: 10, color: COLORS.textDim, align: "right",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Slide 6 — Live Demo
// ────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bg };

  // Big play triangle
  slide.addShape("rightTriangle", {
    x: 5.7, y: 2.3, w: 1.9, h: 1.6,
    fill: { color: COLORS.brand }, line: { color: COLORS.brand },
  });

  slide.addText("LIVE DEMO", {
    x: 0, y: 4.4, w: 13.33, h: 1,
    fontFace: FONT_HEADER, fontSize: 64, bold: true, color: COLORS.text,
    align: "center", charSpacing: 6,
  });

  slide.addText("3 σενάρια · ~2 λεπτά", {
    x: 0, y: 5.5, w: 13.33, h: 0.5,
    fontFace: FONT_BODY, fontSize: 18, color: COLORS.brandLight,
    align: "center", italic: true,
  });

  // Demo scenarios
  const demos = [
    "Λιανική απόδειξη με POS",
    "Εξόφληση εκκρεμούς B2B από Ιστορικό",
    "Φιλτράρισμα + σύνολα περιόδου",
  ];
  demos.forEach((d, i) => {
    const totalWidth = 11;
    const itemW = totalWidth / 3;
    const x = 1.16 + i * itemW;
    slide.addText(`0${i + 1}`, {
      x: x, y: 6.2, w: itemW, h: 0.4,
      fontFace: FONT_HEADER, fontSize: 14, bold: true, color: COLORS.brand,
      align: "center",
    });
    slide.addText(d, {
      x: x, y: 6.55, w: itemW, h: 0.4,
      fontFace: FONT_BODY, fontSize: 12, color: COLORS.textMuted,
      align: "center",
    });
  });

  slide.addText("06", {
    x: 12.3, y: 7.1, w: 0.5, h: 0.3,
    fontFace: FONT_HEADER, fontSize: 10, color: COLORS.textDim, align: "right",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Slide 7 — Open Source / Bratnet Reference
// ────────────────────────────────────────────────────────────────────────────
{
  const slide = addBase("Open Source · Bratnet Reference");

  // Big quote-style highlight
  slide.addShape("rect", {
    x: 0.6, y: 1.4, w: 12.1, h: 1.5,
    fill: { color: COLORS.brandDim }, line: { color: COLORS.brand, width: 2 },
    rectRadius: 0.1,
  });
  slide.addShape("rect", {
    x: 0.6, y: 1.4, w: 0.08, h: 1.5,
    fill: { color: COLORS.brand }, line: { color: COLORS.brand },
  });
  slide.addText("Η εφαρμογή θα γίνει open-source reference implementation της Bratnet", {
    x: 0.9, y: 1.55, w: 11.7, h: 0.6,
    fontFace: FONT_HEADER, fontSize: 18, bold: true, color: COLORS.text,
  });
  slide.addText("Στόχος: παράδειγμα καθαρής, σύγχρονης ενσωμάτωσης για developers και επιχειρήσεις που θέλουν να συνδέσουν δικά τους συστήματα", {
    x: 0.9, y: 2.15, w: 11.7, h: 0.7,
    fontFace: FONT_BODY, fontSize: 13, color: COLORS.textMuted, italic: true,
  });

  // What makes it "reference-worthy" — checklist
  slide.addText("Τι το κάνει αξιοποιήσιμο ως reference:", {
    x: 0.6, y: 3.2, w: 12.1, h: 0.4,
    fontFace: FONT_HEADER, fontSize: 14, bold: true, color: COLORS.brandLight,
  });

  const points = [
    { h: "Καθαρή αρχιτεκτονική", d: ".env για config · DB για state · zustand για cache" },
    { h: "Documented codebase", d: "Σχόλια σε κάθε route, validation και complex hook" },
    { h: "Real-world gotchas λυμένα", d: "Auto-retry 603 · tidNsp naming · correlatedInvoices για 5.1" },
    { h: "Production-ready UX", d: "Skeleton loaders · Toasts · Validation · Mobile-first" },
  ];

  points.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 6.05;
    const y = 3.75 + row * 1.6;

    slide.addShape("rect", {
      x, y, w: 5.9, h: 1.45,
      fill: { color: COLORS.surface }, line: { color: COLORS.border, width: 1 },
      rectRadius: 0.08,
    });
    // checkmark badge
    slide.addShape("ellipse", {
      x: x + 0.25, y: y + 0.45, w: 0.55, h: 0.55,
      fill: { color: COLORS.emerald }, line: { color: COLORS.emerald },
    });
    slide.addText("✓", {
      x: x + 0.25, y: y + 0.45, w: 0.55, h: 0.55,
      fontFace: FONT_HEADER, fontSize: 18, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    slide.addText(p.h, {
      x: x + 0.95, y: y + 0.25, w: 4.8, h: 0.45,
      fontFace: FONT_HEADER, fontSize: 14, bold: true, color: COLORS.text,
    });
    slide.addText(p.d, {
      x: x + 0.95, y: y + 0.7, w: 4.8, h: 0.7,
      fontFace: FONT_BODY, fontSize: 11, color: COLORS.textMuted, valign: "top",
    });
  });

  slide.addText("07", {
    x: 12.3, y: 7.1, w: 0.5, h: 0.3,
    fontFace: FONT_HEADER, fontSize: 10, color: COLORS.textDim, align: "right",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Slide 8 — Q&A / Thanks
// ────────────────────────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bg };

  // accent panel left
  slide.addShape("rect", {
    x: 0, y: 0, w: 0.4, h: 7.5,
    fill: { color: COLORS.brand }, line: { color: COLORS.brand },
  });

  slide.addText("Ευχαριστώ", {
    x: 1.2, y: 1.8, w: 11, h: 1.4,
    fontFace: FONT_HEADER, fontSize: 80, bold: true, color: COLORS.text,
  });

  slide.addText("Q & A", {
    x: 1.2, y: 3.1, w: 11, h: 0.8,
    fontFace: FONT_HEADER, fontSize: 36, color: COLORS.brandLight, italic: true,
  });

  // contact / project info
  slide.addShape("rect", {
    x: 1.2, y: 5, w: 10.9, h: 1.6,
    fill: { color: COLORS.surface }, line: { color: COLORS.border, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(
    [
      { text: "Ρετσιλάς Γεώργιος   ", options: { fontSize: 16, bold: true, color: COLORS.text } },
      { text: "·   Α.Μ. 2022143\n", options: { fontSize: 14, color: COLORS.textMuted } },
      { text: "Ελεύθερη Επιλογή · 8ο Εξάμηνο\n", options: { fontSize: 12, color: COLORS.textMuted } },
      { text: "myAade App — σε συνεργασία με Bratnet (etimologiera)", options: { fontSize: 12, color: COLORS.brandLight, italic: true } },
    ],
    { x: 1.5, y: 5.2, w: 10.5, h: 1.4, fontFace: FONT_BODY, valign: "middle" },
  );

  slide.addText("08", {
    x: 12.3, y: 7.1, w: 0.5, h: 0.3,
    fontFace: FONT_HEADER, fontSize: 10, color: COLORS.textDim, align: "right",
  });
}

pres.writeFile({ fileName: "myAade-Presentation.pptx" }).then((fn) => {
  console.log("Saved:", fn);
});
