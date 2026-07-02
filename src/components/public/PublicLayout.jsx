import { Outlet, Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import WhatsappFloat from "./WhatsappFloat";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/catalogo" className="flex items-center gap-3 min-w-0">
            <img
              src="/logoMundoTIN-TIN-sinFodno.png"
              alt="El Mundo de Tin-Tin"
              className="h-10 w-auto shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-gray-800 sm:text-lg">
                El Mundo de Tin-Tin
              </p>
              <p className="-mt-0.5 truncate text-[11px] font-medium text-gray-500">
                Catálogo de productos
              </p>
            </div>
          </Link>

          <Link
            to="/login"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Iniciar sesión</span>
            <span className="sm:hidden">Ingresar</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>

      <WhatsappFloat />

      <footer className="border-t border-border bg-white py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Mundo TIN-TIN &mdash; Todos los derechos reservados.
      </footer>
    </div>
  );
}
