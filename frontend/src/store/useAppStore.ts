import { create } from "zustand";
import {
  getCustomers,
  getCompany,
  getSeries,
  addCustomer as apiAddCustomer,
  deleteCustomer as apiDeleteCustomer,
} from "../api";
import type { Customer, Company, SeriesOption } from "../types";

interface AppState {
  // ── Customers ─────────────────────────────────
  customers: Customer[];
  customersLoaded: boolean;
  customersLoading: boolean;
  loadCustomers: (force?: boolean) => Promise<Customer[]>;
  addCustomer: (payload: Record<string, unknown>) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;

  // ── Series ────────────────────────────────────
  series: SeriesOption[];
  seriesLoaded: boolean;
  seriesLoading: boolean;
  loadSeries: (force?: boolean) => Promise<SeriesOption[]>;
  refreshSeries: () => Promise<SeriesOption[]>;

  // ── Company ───────────────────────────────────
  company: Company | null;
  companyLoaded: boolean;
  companyLoading: boolean;
  loadCompany: (force?: boolean) => Promise<Company | null>;

  // ── Invalidation helper ───────────────────────
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Customers ─────────────────────────────────
  customers: [],
  customersLoaded: false,
  customersLoading: false,

  loadCustomers: async (force = false) => {
    const { customers, customersLoaded, customersLoading } = get();
    if (!force && customersLoaded) return customers;
    if (customersLoading) return customers;

    set({ customersLoading: true });
    try {
      const data = await getCustomers();
      const list: Customer[] = Array.isArray(data) ? data : [];
      set({ customers: list, customersLoaded: true, customersLoading: false });
      return list;
    } catch (err) {
      set({ customersLoading: false });
      throw err;
    }
  },

  addCustomer: async (payload) => {
    const created = await apiAddCustomer(payload);
    set((state) => ({ customers: [...state.customers, created] }));
    return created as Customer;
  },

  deleteCustomer: async (id) => {
    await apiDeleteCustomer(id);
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
  },

  // ── Series ────────────────────────────────────
  series: [],
  seriesLoaded: false,
  seriesLoading: false,

  loadSeries: async (force = false) => {
    const { series, seriesLoaded, seriesLoading } = get();
    if (!force && seriesLoaded) return series;
    if (seriesLoading) return series;

    set({ seriesLoading: true });
    try {
      const res = await getSeries();
      const list: SeriesOption[] = res?.success && res.series ? res.series : [];
      set({ series: list, seriesLoaded: true, seriesLoading: false });
      return list;
    } catch (err) {
      set({ seriesLoading: false });
      throw err;
    }
  },

  refreshSeries: async () => {
    return get().loadSeries(true);
  },

  // ── Company ───────────────────────────────────
  company: null,
  companyLoaded: false,
  companyLoading: false,

  loadCompany: async (force = false) => {
    const { company, companyLoaded, companyLoading } = get();
    if (!force && companyLoaded) return company;
    if (companyLoading) return company;

    set({ companyLoading: true });
    try {
      const data = await getCompany();
      set({ company: data, companyLoaded: true, companyLoading: false });
      return data;
    } catch (err) {
      set({ companyLoading: false });
      throw err;
    }
  },

  // ── Reset ─────────────────────────────────────
  reset: () =>
    set({
      customers: [],
      customersLoaded: false,
      series: [],
      seriesLoaded: false,
      company: null,
      companyLoaded: false,
    }),
}));
