import { useState, useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const displayName = user?.displayName || "Administrador";
  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-white px-4 shadow-sm lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-light hover:text-primary lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="min-w-0 flex-1 pl-1 lg:pl-5">
        <p className="truncate text-sm font-semibold text-gray-800">
          {getGreeting()}, {displayName.split(" ")[0]} 👋
        </p>
        <p className="text-xs text-gray-600">Bienvenido nuevamente</p>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-primary-light"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-medium leading-tight text-gray-800">
              {displayName}
            </p>
            <p className="text-xs leading-tight text-gray-600">{user?.email}</p>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-border">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-gray-800">{displayName}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-medium text-primary">
                Administrador
              </span>
            </div>
            <div className="p-2">
              <button
                onClick={() => { logout(); setDropdownOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
