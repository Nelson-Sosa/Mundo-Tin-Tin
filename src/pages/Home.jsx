import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-primary-soft">
          <p className="text-sm text-gray-600">
            Bienvenido, <span className="font-semibold text-gray-800">{user.email}</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Tu rol es: <span className="capitalize text-primary">{user.role}</span>
          </p>
          <p className="mt-6 text-sm text-gray-500">
            El catálogo de productos estará disponible próximamente.
          </p>
        </div>
      </div>
    </div>
  );
}
