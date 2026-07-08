import { useState, useEffect } from "react";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  XCircle,
  Inbox,
  Eye,
  CreditCard as CardIcon,
  Banknote,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/layout/PageContainer";
import StatCard from "../../components/ui/StatCard";
import SectionHeader from "../../components/ui/SectionHeader";
import EmptyState from "../../components/ui/EmptyState";

import { formatCurrency } from "../../utils/formatCurrency";
import { getDashboardData } from "../../services/dashboardService";

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function productsSummary(items) {
  if (!items || items.length === 0) return "Sin productos";
  const first = items[0].name;
  const rest = items.length - 1;
  return rest > 0 ? `${first} +${rest} más` : first;
}

function PaymentBadge({ method }) {
  if (method === "transfer") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Transferencia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Efectivo
    </span>
  );
}

function StatusBadge({ status }) {
  const isCancelled = (status || "completed") === "cancelled";
  if (isCancelled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
        Anulada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      Completada
    </span>
  );
}

const statDefs = [
  // Rendimiento del día
  { key: "ventasDia", title: "Ventas del día", icon: ShoppingCart, accent: "primary", kind: "currency" },
  { key: "gananciasDia", title: "Ganancias (hoy)", icon: Banknote, accent: "emerald", kind: "currency" },
  { key: "gastosDia", title: "Gastos (hoy)", icon: CreditCard, accent: "rose", kind: "currency" },

  // Rendimiento acumulado
  { key: "ventasMes", title: "Ventas del mes", icon: TrendingUp, accent: "primary", kind: "currency" },
  { key: "gananciasMes", title: "Ganancias (mes)", icon: DollarSign, accent: "emerald", kind: "currency" },
  { key: "gastosSemana", title: "Gastos (semana)", icon: CreditCard, accent: "rose", kind: "currency" },
  { key: "gastosMes", title: "Gastos (mes)", icon: CreditCard, accent: "rose", kind: "currency" },

  // Inventario
  { key: "productosVendidos", title: "Prod. vendidos (mes)", icon: ShoppingBag, accent: "primary", kind: "number" },
  { key: "stockBajo", title: "Stock bajo", icon: AlertTriangle, accent: "rose", kind: "number" },
  { key: "agotados", title: "Productos agotados", icon: XCircle, accent: "primary", kind: "number" },
];

// ---------------------------------------------------------------------------
// Vista mobile de orden — card apilada por fila
// ---------------------------------------------------------------------------
function OrderCard({ order, onView }) {
  return (
    <div className="flex flex-col gap-2 xs:gap-3 rounded-xl border border-border bg-white p-3 xs:p-4 shadow-sm">
      {/* Fila 1: fecha + estado */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">
          {formatDate(order.createdAt)}
        </span>
        <StatusBadge status={order.status} />
      </div>

      {/* Fila 2: productos */}
      <p className="truncate text-sm font-semibold text-gray-800">
        {productsSummary(order.items)}
      </p>

      {/* Fila 3: cliente + método de pago */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-gray-500">
          {order.clientName || "Cliente general"}
        </span>
        <PaymentBadge method={order.paymentMethod} />
      </div>

      {/* Fila 4: total + acción */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-bold text-gray-800">
          {formatCurrency(order.total)}
        </span>
        <button
          onClick={onView}
          className="flex items-center gap-1.5 rounded-lg bg-primary-light px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          title="Ver en historial"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboardData()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const hasRecentOrders = data?.recentOrders && data.recentOrders.length > 0;

  return (
    <PageContainer title="Dashboard" description="Resumen general del negocio">

      {/* ------------------------------------------------------------------ */}
      {/* Stat cards                                                          */}
      {/* Mobile: 2 columnas | Tablet: 3 columnas | Desktop: 4 columnas      */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statDefs.map((stat) => {
          let value = null;

          if (!loading && data && data.metrics) {
            const m = data.metrics;
            if (stat.key === "ventasDia") value = m.ventas.dia;
            else if (stat.key === "gananciasDia") value = m.ganancias.dia;
            else if (stat.key === "gastosDia") value = m.gastos.dia;

            else if (stat.key === "ventasMes") value = m.ventas.mes;
            else if (stat.key === "gananciasMes") value = m.ganancias.mes;
            else if (stat.key === "gastosSemana") value = m.gastos.semana;
            else if (stat.key === "gastosMes") value = m.gastos.mes;

            else if (stat.key === "productosVendidos") value = m.inventario.productosVendidos;
            else if (stat.key === "stockBajo") value = m.inventario.stockBajo;
            else if (stat.key === "agotados") value = m.inventario.agotados;
          }

          return (
            <StatCard
              key={stat.key}
              title={stat.title}
              icon={stat.icon}
              accent={stat.accent}
              kind={stat.kind}
              value={loading ? null : value}
            />
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Últimas ventas                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 sm:mt-8">
        <SectionHeader
          title="Últimas ventas"
          description={
            hasRecentOrders
              ? `${data.recentOrders.length} ventas recientes`
              : "Historial de transacciones recientes"
          }
        />

        <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
          {/* Skeleton de carga */}
          {loading ? (
            <div className="space-y-2 xs:space-y-3 p-3 xs:p-4 sm:p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : !hasRecentOrders ? (
            <EmptyState
              icon={Inbox}
              title="No existen ventas registradas"
              description="Las ventas aparecerán aquí cuando comiences a utilizar el sistema."
              action={
                <button
                  onClick={() => navigate("/admin/ventas")}
                  className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  Ir al módulo de Ventas
                </button>
              }
            />
          ) : (
            <>
              {/*
                MOBILE / TABLET (< lg): cards apiladas, una por venta.
                Evita el scroll horizontal y mejora la legibilidad táctil.
              */}
              <div className="flex flex-col divide-y divide-gray-100 p-2 xs:p-3 sm:p-4 lg:hidden">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="py-3 first:pt-0 last:pb-0">
                    <OrderCard
                      order={order}
                      onView={() => navigate("/admin/historial")}
                    />
                  </div>
                ))}
              </div>

              {/*
                DESKTOP (≥ lg): tabla completa con todas las columnas.
                Se mantiene idéntica a la versión original.
              */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Productos</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Cliente</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Pago</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.recentOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 text-xs">{formatDate(order.createdAt)}</td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-gray-700 text-xs">{productsSummary(order.items)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">{order.clientName || "Cliente general"}</td>
                        <td className="whitespace-nowrap px-4 py-3"><PaymentBadge method={order.paymentMethod} /></td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-800 text-xs">{formatCurrency(order.total)}</td>
                        <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            onClick={() => navigate("/admin/historial")}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-light hover:text-primary"
                            title="Ver en historial"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
