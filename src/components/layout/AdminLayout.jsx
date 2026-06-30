import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background-secondary">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
        }`}
      >
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
