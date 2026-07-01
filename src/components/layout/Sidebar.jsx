import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingCart,
  History,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const mainNav = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Ventas", href: "/admin/ventas", icon: ShoppingCart },
  { name: "Historial", href: "/admin/historial", icon: History },
  { name: "Clientes", href: "/admin/clientes", icon: Users },
  { name: "Gastos", href: "/admin/gastos", icon: DollarSign },
  { name: "Productos", href: "/admin/productos", icon: Package },
  { name: "Categorías", href: "/admin/categorias", icon: Tags },
  { name: "Inventario", href: "/admin/inventario", icon: Warehouse },
];

const comingSoon = [
  { name: "Reportes", icon: BarChart3 },
];

const secondaryNav = [{ name: "Configuración", icon: Settings }];

export default function Sidebar({ collapsed, mobileOpen, onClose, onToggle }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  function NavItem({ item, disabled }) {
    const isActive = item.href && pathname === item.href;

    if (disabled) {
      return (
        <div className="group relative flex cursor-not-allowed items-center rounded-lg px-3 py-3 text-sm text-gray-500 select-none">
          <div className="flex w-6 shrink-0 items-center justify-center">
            <item.icon className="h-5 w-5 text-gray-400" />
          </div>
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              collapsed ? "max-w-0 opacity-0" : "ml-3 max-w-40 opacity-100"
            }`}
          >
            {item.name}
          </span>
          {!collapsed && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary">
              <Lock className="h-3 w-3" />
              Disponible próximamente
            </span>
          )}
        </div>
      );
    }

    return (
      <NavLink
        to={item.href}
        className={({ isActive: active }) =>
          `relative flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
            active
              ? "bg-primary-light text-primary font-semibold"
              : "text-gray-700 hover:bg-primary-light/50 hover:text-primary"
          } ${collapsed ? "px-3 py-3 justify-center" : "px-3 py-3"}`
        }
      >
        {({ isActive: active }) => (
          <>
            {active && (
              <div className="absolute left-0 top-1/2 h-3/4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            <div className="flex w-6 shrink-0 items-center justify-center">
              <item.icon
                className={`h-5 w-5 transition-colors ${
                  active ? "text-primary" : "text-gray-500 group-hover:text-primary"
                }`}
              />
            </div>
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                collapsed ? "max-w-0 opacity-0" : "ml-3 max-w-40 opacity-100"
              }`}
            >
              {item.name}
            </span>
          </>
        )}
      </NavLink>
    );
  }

  function SectionLabel({ text }) {
    return (
      <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        <span
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
            collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
          }`}
        >
          {text}
        </span>
      </div>
    );
  }

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex h-[72px] shrink-0 items-center border-b border-border px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logoMundoTIN-TIN-sinFodno.png"
              alt="Mundo TIN-TIN"
              className={`shrink-0 object-contain transition-all duration-300 ${
                collapsed ? "h-9 w-9" : "h-10 w-auto"
              }`}
            />
            <div
              className={`flex-1 min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ${
                collapsed ? "max-w-0 opacity-0" : "max-w-full opacity-100"
              }`}
            >
              <p className="truncate text-base font-extrabold tracking-tight text-gray-800 sm:text-lg">
                Mundo TIN-TIN
              </p>
              <p className="truncate text-[11px] font-medium text-gray-600 leading-tight">
                Administración del Negocio
              </p>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onClose}
              className="ml-auto rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-light hover:text-primary lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <SectionLabel text="Navegación" />
          {mainNav.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}

          <div className="my-5 border-t border-border" />

          <SectionLabel text="Próximamente" />
          {comingSoon.map((item) => (
            <NavItem key={item.name} item={item} disabled />
          ))}

          <div className="my-5 border-t border-border" />

          {secondaryNav.map((item) => (
            <NavItem key={item.name} item={item} disabled />
          ))}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <button
            onClick={onToggle}
            className="hidden w-full items-center justify-center rounded-lg px-3 py-2.5 text-gray-500 transition-colors hover:bg-primary-light hover:text-primary lg:flex"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={() => { logout(); }}
            className="mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <div className="flex w-6 shrink-0 items-center justify-center">
              <LogOut className="h-5 w-5" />
            </div>
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                collapsed ? "max-w-0 opacity-0" : "ml-3 max-w-40 opacity-100"
              }`}
            >
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border shadow-sm transition-all duration-300 max-lg:data-[state=closed]:-translate-x-full ${
          collapsed ? "lg:w-16" : "lg:w-72"
        }`}
        data-state={mobileOpen ? "open" : "closed"}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
