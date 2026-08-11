import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Materiels from './pages/Materiels';
import NouvelleSortie from './pages/NouvelleSortie';
import Sorties from './pages/Sorties';
import Agents from './pages/Agents';
import Services from './pages/Services';
import Fournisseurs from './pages/Fournisseurs';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="materiels" element={<Materiels />} />
            <Route path="sorties" element={<NouvelleSortie />} />
            <Route path="sorties/historique" element={<Sorties />} />
            <Route path="agents" element={<Agents />} />
            <Route path="services" element={<Services />} />
            <Route path="fournisseurs" element={<Fournisseurs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
