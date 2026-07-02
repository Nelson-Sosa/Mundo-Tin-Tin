import { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Eye,
  Ban,
  Banknote,
  CreditCard,
  ShoppingBag,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import * as orderService from "../../services/orderService";
import { formatCurrency } from "../../utils/formatCurrency";
import PageContainer from "../../components/layout/PageContainer";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";

const PAGE_SIZE = 20;

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(timestamp) {
  if (!timestamp) return "—";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" });
  }
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

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  const lineItems = order.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">Detalle de venta</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Fecha</p>
              <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Estado</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-gray-500">Cliente</p>
              <p className="font-medium text-gray-800">{order.clientName || "Cliente general"}</p>
            </div>
            <div>
              <p className="text-gray-500">Método de pago</p>
              <PaymentBadge method={order.paymentMethod} />
            </div>
            {order.pedidoId && (
              <div className="col-span-2">
                <p className="text-gray-500">Originado desde</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  <FileText className="h-3 w-3" />
                  Pedido #{order.pedidoId.slice(0, 8)}…
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Productos</p>
            <div className="divide-y divide-gray-100 rounded-lg border border-border">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="ml-3 shrink-0 font-medium text-gray-800">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-800">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Descuento{" "}
                  {order.discountType === "percentage"
                    ? `(${order.discountValue}%)`
                    : ""}
                </span>
                <span className="font-medium text-danger">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="text-base font-bold text-gray-900">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelConfirmDialog({ order, onConfirm, onClose, cancelling }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-800">Anular venta</h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            ¿Estás seguro de anular esta venta por{" "}
            <span className="font-semibold">{formatCurrency(order.total)}</span>?
          </p>
          <p className="mt-1 text-xs text-gray-500">El stock de los productos será restaurado.</p>

          <div className="mt-6 flex w-full gap-3">
            <button
              onClick={onClose}
              disabled={cancelling}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={cancelling}
              className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {cancelling ? "Anulando..." : "Sí, anular"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isCancelled = (status || "completed") === "cancelled";
  if (isCancelled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-[11px] font-medium text-danger">
        <XCircle className="h-3 w-3" />
        Anulada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Completada
    </span>
  );
}

function PaymentBadge({ method }) {
  if (method === "transfer") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-medium text-primary">
        <CreditCard className="h-3 w-3" />
        Transferencia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
      <Banknote className="h-3 w-3" />
      Efectivo
    </span>
  );
}

export default function Historial() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const [totals, setTotals] = useState(null);
  const [totalsLoading, setTotalsLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = useCallback(
    async (reset = false, cursor = null) => {
      setLoading(true);
      try {
        const result = await orderService.getOrdersWithFilters({
          dateFrom: dateFrom ? new Date(dateFrom) : undefined,
          dateTo: dateTo ? new Date(dateTo + "T23:59:59") : undefined,
          paymentMethod: paymentFilter,
          clientName: clientFilter,
          pageSize: PAGE_SIZE,
          lastDoc: cursor,
        });
        if (reset) {
          setOrders(result.orders);
        } else {
          setOrders((prev) => [...prev, ...result.orders]);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        if (reset) setPage(1);
      } catch (err) {
        const msg = err?.message || "";
        if (msg.includes("requires an index")) {
          console.error("Índice compuesto requerido por Firestore:", err);
          toast.error("Se necesita crear un índice en Firebase. Revisá la consola del navegador para el link de creación.", { duration: 8000 });
        } else {
          toast.error("Error al cargar el historial");
        }
      } finally {
        setLoading(false);
      }
    },
    [dateFrom, dateTo, paymentFilter, clientFilter],
  );

  const loadTotals = useCallback(async () => {
    setTotalsLoading(true);
    try {
      const data = await orderService.getOrderSummary();
      setTotals(data);
    } catch {
      setTotals(null);
    } finally {
      setTotalsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(true);
  }, [loadOrders]);

  useEffect(() => {
    loadTotals();
  }, [loadTotals]);

  function handleFilter() {
    loadOrders(true);
  }

  function handleClearFilters() {
    setDateFrom("");
    setDateTo("");
    setPaymentFilter("all");
    setClientFilter("");
  }

  function handleNextPage() {
    if (hasMore && lastDoc) {
      setPage((p) => p + 1);
      loadOrders(false, lastDoc);
    }
  }

  function handlePrevPage() {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }

  async function handleCancelOrder() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await orderService.cancelOrder(cancelTarget.id, user?.uid);
      const hadPedido = !!cancelTarget.pedidoId;
      toast.success(
        hadPedido
          ? "Venta anulada — stock restituido y pedido marcado cancelado"
          : "Venta anulada correctamente",
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelTarget.id ? { ...o, status: "cancelled", cancelledAt: new Date() } : o,
        ),
      );
      setCancelTarget(null);
      if (selectedOrder?.id === cancelTarget.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      }
      loadTotals();
    } catch (err) {
      if (err.message === "ORDER_ALREADY_CANCELLED") {
        toast.error("Esta venta ya fue anulada");
      } else {
        toast.error("Error al anular la venta");
      }
    } finally {
      setCancelling(false);
    }
  }

  const hasFilters = dateFrom || dateTo || paymentFilter !== "all" || clientFilter;

  return (
    <PageContainer
      title="Historial de Ventas"
      description="Consultá, filtrá y gestioná las ventas registradas"
    >
      {/* Totals */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={ShoppingBag}
          title={totalsLoading ? "Ventas de hoy" : `Ventas de hoy — ${totals?.today?.count ?? 0} ventas`}
          value={totalsLoading ? null : formatCurrency(totals?.today?.total ?? 0)}
          kind="currency"
        />
        <StatCard
          icon={Calendar}
          title="Ventas de la semana"
          value={totalsLoading ? null : formatCurrency(totals?.week?.total ?? 0)}
          kind="currency"
        />
        <StatCard
          icon={TrendingUp}
          title="Ventas del mes"
          value={totalsLoading ? null : formatCurrency(totals?.month?.total ?? 0)}
          kind="currency"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl bg-white p-3 shadow-sm ring-1 ring-border sm:p-5">
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <div className="min-w-0 flex-1 sm:flex-none">
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:mb-1 sm:text-[11px]">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-3 sm:py-2 sm:text-sm sm:w-auto"
            />
          </div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:mb-1 sm:text-[11px]">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-3 sm:py-2 sm:text-sm sm:w-auto"
            />
          </div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:mb-1 sm:text-[11px]">
              Método de pago
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-3 sm:py-2 sm:text-sm sm:w-auto"
            >
              <option value="all">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:mb-1 sm:text-[11px]">
              Cliente
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 sm:left-2.5 sm:h-4 sm:w-4" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-1.5 pl-7 pr-2.5 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 sm:py-2 sm:pl-8 sm:pr-3 sm:text-sm sm:w-44"
              />
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              onClick={handleFilter}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:flex-none"
            >
              Filtrar
            </button>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:flex-none"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>


      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border lg:block">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No hay ventas registradas"
            description={hasFilters ? "No se encontraron ventas con los filtros aplicados" : "Las ventas que registres aparecerán aquí"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Productos
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Cliente
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pago
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Descuento
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const isCancelled = (order.status || "completed") === "cancelled";
                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-800" title={order.items?.map((i) => i.name).join(", ")}>
                        {productsSummary(order.items)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {order.clientName || (
                          <span className="text-gray-400">Cliente general</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <PaymentBadge method={order.paymentMethod} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                        {order.discount > 0 ? formatCurrency(order.discount) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-primary-light hover:text-primary"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => setCancelTarget(order)}
                              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-danger/10 hover:text-danger"
                              title="Anular venta"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-gray-500">
              Página {page}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={handleNextPage}
                disabled={!hasMore}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>


      <div className="space-y-3 lg:hidden">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No hay ventas registradas"
            description={hasFilters ? "No se encontraron ventas con los filtros aplicados" : "Las ventas que registres aparecerán aquí"}
          />
        ) : (
          <>
            {orders.map((order) => {
              const isCancelled = (order.status || "completed") === "cancelled";
              return (
                <div
                  key={order.id}
                  className={`rounded-xl bg-white p-3 shadow-sm ring-1 sm:p-4 ${
                    isCancelled ? "ring-danger/20" : "ring-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatDateShort(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-light hover:text-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!isCancelled && (
                        <button
                          onClick={() => setCancelTarget(order)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-gray-400" />
                      {order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? "s" : ""}
                    </span>
                    <PaymentBadge method={order.paymentMethod} />
                    <span className="text-gray-500">
                      {order.clientName || "Cliente general"}
                    </span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {productsSummary(order.items)}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Mobile Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500 sm:text-sm">
                Página {page}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed sm:px-3 sm:text-sm"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant.</span>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed sm:px-3 sm:text-sm"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <span className="sm:hidden">Sig.</span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
      {cancelTarget && (
        <CancelConfirmDialog
          order={cancelTarget}
          onConfirm={handleCancelOrder}
          onClose={() => setCancelTarget(null)}
          cancelling={cancelling}
        />
      )}
    </PageContainer>
  );
}
