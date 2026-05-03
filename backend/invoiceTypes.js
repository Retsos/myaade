const INVOICE_TYPES = {
  "1.1": {
    label: "Τιμολόγιο Πώλησης",
    defaultSeries: "ΤΠ",
    isUnsigned: false,
    defaultPaymentType: 5,
    defaultClassificationCategory: "category1_1",
    defaultClassificationType: "E3_561_001",
    requiresCounterpart: true,
  },
  "2.1": {
    label: "Τιμολόγιο Παροχής Υπηρεσιών",
    defaultSeries: "ΤΠΥ",
    isUnsigned: false,
    defaultPaymentType: 5,
    defaultClassificationCategory: "category1_3",
    defaultClassificationType: "E3_561_001",
    requiresCounterpart: true,
  },
  "2.4": {
    label: "Τιμολόγιο Παροχής Ενδοκοινοτικά",
    defaultSeries: "ΤΠΥ-Ε",
    isUnsigned: false,
    defaultPaymentType: 5,
    defaultClassificationCategory: "category1_3",
    defaultClassificationType: "E3_561_001",
    requiresCounterpart: true,
  },
  "5.1": {
    label: "Πιστωτικό Τιμολόγιο",
    defaultSeries: "ΠΤ",
    isUnsigned: false,
    defaultPaymentType: 5,
    defaultClassificationCategory: "category1_3",
    defaultClassificationType: "E3_561_001",
    requiresCounterpart: true,
  },
  "11.1": {
    label: "Απόδειξη Λιανικής Πώλησης",
    defaultSeries: "ΑΛΠ",
    isUnsigned: false,
    defaultPaymentType: 3,
    defaultClassificationCategory: "category1_1",
    defaultClassificationType: "E3_561_007",
    requiresCounterpart: false,
  },
  "11.2": {
    label: "Απόδειξη Παροχής Υπηρεσιών",
    defaultSeries: "ΑΠΥ",
    isUnsigned: false,
    defaultPaymentType: 3,
    defaultClassificationCategory: "category1_3",
    defaultClassificationType: "E3_561_007",
    requiresCounterpart: false,
  },
};

const PAYMENT_TYPES = {
  1: "Εγχώριες Πληρωμές POS",
  2: "Εγχώριες Πληρωμές Web Banking",
  3: "Μετρητά",
  4: "Επιταγή",
  5: "Επί Πιστώσει",
  6: "Ανταλλαγή Αγαθών",
  7: "IRIS",
  8: "Κάρτα POS",
};

const VAT_RATES = {
  1: { rate: 0.24, label: "24%" },
  2: { rate: 0.13, label: "13%" },
  3: { rate: 0.06, label: "6%" },
  4: { rate: 0.17, label: "17%" },
  5: { rate: 0.09, label: "9%" },
  6: { rate: 0.04, label: "4%" },
  7: { rate: 0, label: "0% (Χωρίς ΦΠΑ)", defaultExemptionCategory: 7 },
  8: { rate: 0, label: "0% (Άνευ ΦΠΑ)" },
};

module.exports = { INVOICE_TYPES, PAYMENT_TYPES, VAT_RATES };
