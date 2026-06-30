import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  XCircle,
  Inbox,
} from "lucide-react";
import PageContainer from "../../components/layout/PageContainer";
import StatCard from "../../components/ui/StatCard";
import SectionHeader from "../../components/ui/SectionHeader";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonChart from "../../components/ui/SkeletonChart";

const stats = [
  { key: "ventas_dia", title: "Ventas del día", icon: ShoppingCart, accent: "primary" },
  { key: "ventas_mes", title: "Ventas del mes", icon: TrendingUp, accent: "rose" },
  { key: "ganancias", title: "Ganancias", icon: DollarSign, accent: "primary" },
  { key: "gastos", title: "Gastos", icon: CreditCard, accent: "rose" },
  { key: "productos_vendidos", title: "Productos vendidos", icon: ShoppingBag, accent: "primary" },
  { key: "stock_bajo", title: "Stock bajo", icon: AlertTriangle, accent: "rose" },
  { key: "agotados", title: "Productos agotados", icon: XCircle, accent: "primary" },
];

export default function Dashboard() {
  return (
    <PageContainer title="Dashboard" description="Resumen general del negocio">
      <StatCards />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader
            title="Últimas ventas"
            description="Historial de transacciones recientes"
          />
          <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
            <EmptyState
              icon={Inbox}
              title="No existen ventas registradas"
              description="Las ventas aparecerán aquí cuando comiences a utilizar el sistema."
              action={
                <button
                  disabled
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  Ir al módulo de Ventas
                </button>
              }
            />
          </div>
        </div>
        <div className="space-y-6">
          <SkeletonChart title="Ventas por mes" />
          <SkeletonChart title="Productos más vendidos" />
        </div>
      </div>
    </PageContainer>
  );
}

function StatCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          title={stat.title}
          icon={stat.icon}
          accent={stat.accent}
        />
      ))}
    </div>
  );
}
