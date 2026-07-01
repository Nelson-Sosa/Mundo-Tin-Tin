import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShoppingBag,
  TrendingUp,
  Clock,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

import * as clientService from "../../services/clientService";
import { formatCurrency } from "../../utils/formatCurrency";
import PageContainer from "../../components/layout/PageContainer";
import { ClientModal, ClientForm } from "../../components/clients";
import { useAuth } from "../../context/AuthContext";

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
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
              <p className="text-gray-500">Método de pago</p>
              <PaymentBadge method={order.paymentMethod} />
            </div>
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
                <span className="text-gray-500">Descuento</span>
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

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-border">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-0.5 font-medium text-gray-800 break-words">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  const accentColor = accent === "rose" ? "bg-rose-50 text-rose-500" : "bg-primary-light text-primary";
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-border">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [clientData, ordersData] = await Promise.all([
          clientService.getClientById(id),
          clientService.getClientOrders(id),
        ]);

        if (cancelled) return;

        if (!clientData) {
          toast.error("Cliente no encontrado");
          navigate("/admin/clientes");
          return;
        }
        setClient(clientData);
        setOrders(ordersData);
      } catch (err) {
        if (cancelled) return;
        const msg = err?.message || "";
        if (msg.includes("requires an index")) {
          console.error("Índice compuesto requerido para consultar órdenes del cliente:", err);
          toast.error(
            "Se necesita crear un índice en Firebase. Revisá la consola del navegador para el link de creación.",
            { duration: 8000 },
          );
        } else {
          toast.error("Error al cargar el cliente");
        }
        navigate("/admin/clientes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, navigate]);

  async function handleEditSubmit(formData) {
    setEditLoading(true);
    try {
      await clientService.updateClient(id, formData, user.uid);
      toast.success("Cliente actualizado correctamente");
      setEditModalOpen(false);
      const updated = await clientService.getClientById(id);
      if (updated) setClient(updated);
    } catch (err) {
      if (err instanceof clientService.ValidationError) {
        toast.error("Corregí los errores en el formulario");
      } else {
        toast.error("Error al actualizar el cliente");
      }
    } finally {
      setEditLoading(false);
    }
  }

  if (loading) {
    return (
      <PageContainer title="Detalle del cliente">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!client) return null;

  const activeOrders = orders.filter((o) => (o.status || "completed") !== "cancelled");

  return (
    <PageContainer title={client.name} description="Información del cliente">
      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-border">
          <button
            onClick={() => navigate("/admin/clientes")}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a clientes
          </button>

          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-light"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
        </div>

        {/* Personal info */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            <User className="h-4 w-4" />
            Información personal
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard icon={User} label="Nombre completo" value={client.name} />
            <InfoCard icon={Phone} label="Teléfono" value={client.phone} />
            <InfoCard icon={Mail} label="Correo electrónico" value={client.email} />
            <InfoCard icon={MapPin} label="Dirección" value={client.address} />
            <InfoCard icon={FileText} label="Observaciones" value={client.notes} />
          </div>
        </div>

        {/* Commercial summary */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            <TrendingUp className="h-4 w-4" />
            Resumen comercial
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ShoppingBag}
              label="Compras realizadas"
              value={client.orderCount || 0}
            />
            <StatCard
              icon={TrendingUp}
              label="Total gastado"
              value={formatCurrency(client.totalSpent)}
              accent="rose"
            />
            <StatCard
              icon={Calendar}
              label="Primera compra"
              value={formatDateShort(client.firstPurchaseDate)}
            />
            <StatCard
              icon={Clock}
              label="Última compra"
              value={formatDateShort(client.lastPurchaseDate)}
            />
          </div>
        </div>

        {/* Purchase history */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            <ShoppingBag className="h-4 w-4" />
            Historial de compras
          </h3>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-center shadow-sm ring-1 ring-border">
              <Package className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                {client.name} aún no realizó compras
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
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
                        Pago
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Total
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Estado
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                          {formatDateShort(order.createdAt)}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-gray-800">
                          {productsSummary(order.items)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <PaymentBadge method={order.paymentMethod} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <ClientModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar cliente"
      >
        <ClientForm
          initialData={client}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditModalOpen(false)}
          loading={editLoading}
        />
      </ClientModal>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </PageContainer>
  );
}
