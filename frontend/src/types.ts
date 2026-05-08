export interface Company {
  id: number;
  name: string;
  title: string;
  vat_number: string;
  branch: number;
  country: string;
  doy_code: string;
  doy_name: string;
  city: string;
  postal_code: string;
  street: string;
  street_number: string;
  email: string;
  phone: string;
  website: string;
  gemh: string;
  activity: string;
}

export interface Customer {
  id: number;
  display_name: string;
  vat_number: string;
  country: string;
  branch: number;
  doy_code: string;
  doy_name: string;
  city: string;
  postal_code: string;
  street: string;
  street_number: string;
  email: string;
  phone: string;
  activity: string;
}

export interface InvoiceItem {
  name: string;
  net_value: string;
  vat_category: number;
  quantity: number;
  code?: string;
  unit?: string;
  vat_exemption_category?: number;
  classification_category?: string;
  classification_type?: string;
  ubl_cpv_code?: string;
  ubl_measurement_unit?: string;
  ubl_vat_category?: string;
}

export interface InvoiceRecord {
  id: number;
  customer_name: string;
  customer_vat: string;
  invoice_type: string;
  series: string;
  aa: string;
  issue_date: string;
  total_net_value: number;
  total_vat_amount: number;
  total_gross_value: number;
  mark: string;
  uid: string;
  invoice_url: string;
  status: string;
  created_at: string;
}

export interface SeriesOption {
  id: number;
  name: string;
  next_aa: number;
  invoice_type: string;
  description?: string;
}

export const INVOICE_TYPES = [
  { value: '2.1', label: '2.1 — Τιμολόγιο Παροχής Υπηρεσιών (ΤΠΥ)' },
  { value: '1.1', label: '1.1 — Τιμολόγιο Πώλησης' },
  { value: '2.4', label: '2.4 — Τιμολόγιο Παροχής Ενδοκοινοτικά' },
  { value: '5.1', label: '5.1 — Πιστωτικό Τιμολόγιο' },
  { value: '11.1', label: '11.1 — ΑΛΠ (Απόδειξη Λιανικής Πώλησης)' },
  { value: '11.2', label: '11.2 — ΑΠΥ (Απόδειξη Παροχής Υπηρεσιών)' },
];

export const VAT_CATEGORIES = [
  { value: 1, label: 'ΦΠΑ 24%', rate: 0.24 },
  { value: 2, label: 'ΦΠΑ 13%', rate: 0.13 },
  { value: 3, label: 'ΦΠΑ 6%', rate: 0.06 },
  { value: 7, label: 'ΦΠΑ 0% (Χωρίς)', rate: 0 },
];
