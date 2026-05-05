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

export async function createSign(payload: any) {
  const { data } = await api.post('/createSign', payload);
  if (!data.success) throw data;
  return data;
}

export async function sendSimInvoice(payload: Record<string, unknown>) {
  const { data } = await api.post('/sendSimInvoice', payload);
  if (!data.success) throw data;
  return data;
}
export async function getInvoices() {
  const { data } = await api.get('/invoices');
  return data;
}

export async function saveInvoiceRecord(payload: Record<string, unknown>) {
  const { data } = await api.post('/invoices', payload);
  return data;
}

export async function cancelInvoice(id: number) {
  // TODO: Keep this UI call, but have the backend wire it to /cancelSign or
  // /cancelDeliveryNote once those provider endpoints are implemented.
  const { data } = await api.patch(`/invoices/${id}/cancel`);
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

export default api;
