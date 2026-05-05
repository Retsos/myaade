import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CompanyPage from './pages/CompanyPage';
import NewInvoicePage from './pages/NewInvoicePage';
import HistoryPage from './pages/HistoryPage';
import NewRetailPage from './pages/NewRetailPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/new-invoice" element={<NewInvoicePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/retail" element={<NewRetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
