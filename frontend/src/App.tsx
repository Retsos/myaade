import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CompanyPage from './pages/CompanyPage';
import HistoryPage from './pages/HistoryPage';
import NewCustomerPage from './pages/NewCustomerPage';
import UnifiedCheckoutPage from './pages/CheckoutPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/new-customer" element={<NewCustomerPage />} />
        <Route path="/checkout" element={<UnifiedCheckoutPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
