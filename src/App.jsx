import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AdminRoute from "./routes/AdminRoute";

const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const PublicLayout = lazy(() => import("./components/public/PublicLayout"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const ProductDetail = lazy(() => import("./pages/admin/ProductDetail"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const Ventas = lazy(() => import("./pages/admin/Ventas"));
const Historial = lazy(() => import("./pages/admin/Historial"));
const Clients = lazy(() => import("./pages/admin/Clients"));
const ClientDetail = lazy(() => import("./pages/admin/ClientDetail"));
const GastosOperativos = lazy(() => import("./pages/admin/GastosOperativos"));
const Pedidos = lazy(() => import("./pages/admin/Pedidos"));
const Catalog = lazy(() => import("./pages/public/Catalog"));
const ProductPublicDetail = lazy(() => import("./pages/public/ProductPublicDetail"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
