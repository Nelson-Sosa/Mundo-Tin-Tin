import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductDetail from "./pages/admin/ProductDetail";
import Categories from "./pages/admin/Categories";
import Inventory from "./pages/admin/Inventory";
import Ventas from "./pages/admin/Ventas";
import Historial from "./pages/admin/Historial";
import Clients from "./pages/admin/Clients";
import ClientDetail from "./pages/admin/ClientDetail";
import GastosOperativos from "./pages/admin/GastosOperativos";
import Pedidos from "./pages/admin/Pedidos";
import PublicLayout from "./components/public/PublicLayout";
import Catalog from "./pages/public/Catalog";
import ProductPublicDetail from "./pages/public/ProductPublicDetail";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/catalogo" replace />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="productos" element={<Products />} />
            <Route path="productos/:id" element={<ProductDetail />} />
            <Route path="categorias" element={<Categories />} />
            <Route path="inventario" element={<Inventory />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="historial" element={<Historial />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="clientes/:id" element={<ClientDetail />} />
            <Route path="gastos" element={<GastosOperativos />} />
            <Route path="pedidos" element={<Pedidos />} />
          </Route>

          <Route path="/catalogo" element={<PublicLayout />}>
            <Route index element={<Catalog />} />
            <Route path=":id" element={<ProductPublicDetail />} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard/*" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
