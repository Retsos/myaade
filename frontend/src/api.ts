import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function getCompany() {
  const { data } = await api.get('/company');
  return data;
}

export async function getCustomers() {
  const { data } = await api.get('/customers');
  return data;
}

export async function addCustomer(payload: Record<string, unknown>) {
  const { data } = await api.post('/customers', payload);
  return data;
}

export async function deleteCustomer(id: number) {
  const { data } = await api.delete(`/customers/${id}`);
  return data;
}

export async function sendInvoice(payload: Record<string, unknown>) {
  const { data } = await api.post('/sendInvoice', payload);
  if (!data.success) {
    throw data;
  }
  return data;
}

export async function createSimSign(payload: Record<string, unknown>) {
  const { data } = await api.post('/createSimSign', payload);
  if (!data.success) {
    throw data;
  }
  return data;
}

export async function sendSimInvoice(payload: Record<string, unknown>) {
  const { data } = await api.post('/sendSimInvoice', payload);
  if (!data.success) throw data;
  return data;
}

export interface GetInvoicesParams {
  vat?: string;
  mark?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function getInvoices(params: GetInvoicesParams = {}) {
  const { data } = await api.get('/invoices', { params });
  return data;
}

export async function saveInvoiceRecord(payload: Record<string, unknown>) {
  const { data } = await api.post('/invoices', payload);
  return data;
}

export async function getCredits() {
  const { data } = await api.get('/credits');
  return data;
}

export async function payInvoicePOS(id: number, pay_amount: number) {
  const { data } = await api.post(`/invoices/${id}/pay`, { pay_amount });
  if (!data.success) throw data;
  return data;
}

export async function getSeries(invoice_type?: string) {
  const { data } = await api.get('/series', {
    params: invoice_type ? { invoice_type } : {},
  });
  return data;
}

export async function updateSeriesNextAa(id: number, next_aa: number) {
  const { data } = await api.put(`/series/${id}`, { next_aa });
  return data;
}

export default api;
