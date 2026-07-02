import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClipboardList,
  Search,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Package,
  AlertTriangle,
  Banknote,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Plus,
  Truck,
  Ban,
  FileText,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import * as pedidoService from "../../services/pedidoService";
import * as clientService from "../../services/clientService";
import { getProducts } from "../../services/productService";
import { formatCurrency } from "../../utils/formatCurrency";
import PageContainer from "../../components/layout/PageContainer";
import EmptyState from "../../components/ui/EmptyState";
import StatCard from "../../components/ui/StatCard";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../hooks/useProducts";

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  return sameDay
    ? d.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function productsSummary(items) {
  if (!items || items.length === 0) return "Sin productos";
  const first = items[0].name;
  const rest = items.length - 1;
  return rest > 0 ? `${first} +${rest} más` : first;
}

function parseStockError(msg) {
  // Format: INSUFFICIENT_STOCK_AVAILABLE:Prod A(disponible:2,solicitado:5)|Prod B(...)
  if (!msg.includes("INSUFFICIENT_STOCK")) return null;
  const detail = msg.split(":").slice(1).join(":");
  return detail.split("|").map((part) => {
    const match = part.match(/^(.+?)\(disponible:(\d+),solicitado:(\d+)\)$/);
    if (!match) return { name: part, disponible: "?", solicitado: "?" };
    return { name: match[1], disponible: match[2], solicitado: match[3] };
  });
}

// ─────────────────────────────────────────────────────────────
//  Status Badge
// ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock,
  },
  in_progress: {
    label: "En preparación",
    color: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: Loader2,
  },
  delivered: {
    label: "Entregado",
    color: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-50 text-red-600 ring-red-200",
    icon: XCircle,
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
//  Payment Badge
// ─────────────────────────────────────────────────────────────
function PaymentBadge({ method }) {
  if (!method) return <span className="text-gray-400 text-xs">—</span>;
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

// ─────────────────────────────────────────────────────────────
//  Detail Modal
// ─────────────────────────────────────────────────────────────
function PedidoDetailModal({ pedido, onClose }) {
  if (!pedido) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Detalle del pedido</h3>
            <p className="text-xs text-gray-400 mt-0.5">Creado: {formatDate(pedido.createdAt)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Estado</p>
              <StatusBadge status={pedido.status} />
            </div>
            <div>
              <p className="text-gray-500">Método de pago</p>
              <PaymentBadge method={pedido.paymentMethod} />
            </div>
            <div>
              <p className="text-gray-500">Cliente</p>
              <p className="font-medium text-gray-800">{pedido.clientName || "Cliente general"}</p>
            </div>
            {pedido.saleOrderId && (
              <div>
                <p className="text-gray-500">Venta generada</p>
                <p className="font-medium text-gray-800 text-xs font-mono">{pedido.saleOrderId.slice(0, 8)}…</p>
              </div>
            )}
          </div>

          {pedido.notes && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-medium text-xs text-amber-600 mb-0.5">Notas</p>
              {pedido.notes}
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Productos</p>
            <div className="divide-y divide-gray-100 rounded-lg border border-border">
              {(pedido.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <p className="ml-3 shrink-0 font-medium text-gray-800">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(pedido.subtotal)}</span>
            </div>
            {pedido.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Descuento</span>
                <span className="font-medium text-danger">-{formatCurrency(pedido.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1.5">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="text-base font-bold text-gray-900">{formatCurrency(pedido.total)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-3">
          <button onClick={onClose} className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Confirm Delivery Modal
// ─────────────────────────────────────────────────────────────
function DeliverConfirmModal({ pedido, onConfirm, onClose, delivering }) {
  const [paymentMethod, setPaymentMethod] = useState(pedido?.paymentMethod || "cash");
  const [stockErrors, setStockErrors] = useState(null);

  if (!pedido) return null;

  function handleConfirm() {
    setStockErrors(null);
    onConfirm(paymentMethod, (err) => {
      const errors = parseStockError(err?.message || "");
      if (errors) setStockErrors(errors);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={!delivering ? onClose : undefined} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Truck className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-800">Confirmar entrega</h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Esta acción descontará el stock definitivamente y generará una venta en el Historial.
          </p>
        </div>

        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <p className="font-medium text-gray-700">{productsSummary(pedido.items)}</p>
          <p className="mt-1 text-base font-bold text-gray-900">{formatCurrency(pedido.total)}</p>
          {pedido.clientName && (
            <p className="mt-0.5 text-xs text-gray-500">Cliente: {pedido.clientName}</p>
          )}
        </div>

        {/* Payment method selection */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Método de pago</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod("cash")}
              disabled={delivering}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                paymentMethod === "cash"
                  ? "border-primary bg-primary-light text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Banknote className="h-4 w-4" />
              Efectivo
            </button>
            <button
              onClick={() => setPaymentMethod("transfer")}
              disabled={delivering}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                paymentMethod === "transfer"
                  ? "border-primary bg-primary-light text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Transfer.
            </button>
          </div>
        </div>

        {/* Stock validation errors */}
        {stockErrors && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
              <p className="font-semibold text-danger">Stock insuficiente</p>
            </div>
            <ul className="space-y-1">
              {stockErrors.map((e, i) => (
                <li key={i} className="text-xs text-danger">
                  <span className="font-medium">{e.name}</span>: disponible {e.disponible}, solicitado {e.solicitado}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-400">Ajustá el inventario antes de marcar como entregado.</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={delivering}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={delivering}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {delivering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Cancel Confirm Dialog
// ─────────────────────────────────────────────────────────────
function CancelConfirmDialog({ pedido, onConfirm, onClose, cancelling }) {
  if (!pedido) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-800">Cancelar pedido</h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            El stock reservado de los productos será liberado.
          </p>
          <p className="mt-1 font-semibold text-gray-800">{formatCurrency(pedido.total)}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={cancelling}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={cancelling}
            className="flex-1 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            {cancelling ? "Cancelando…" : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Create Pedido Modal
// ─────────────────────────────────────────────────────────────
function CreatePedidoModal({ onClose, onCreated, userId }) {
  const { products } = useProducts();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stockError, setStockError] = useState(null);

  useEffect(() => {
    clientService.getClients().then(setClients).catch(() => {});
  }, []);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "active"),
    [products],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return activeProducts;
    const q = search.toLowerCase();
    return activeProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q),
    );
  }, [activeProducts, search]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const stockDisponible = product.stock - (product.stockReservado ?? 0);
        if (existing.quantity >= stockDisponible) {
          toast.error(`Stock disponible: ${stockDisponible}`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      const stockDisponible = product.stock - (product.stockReservado ?? 0);
      if (stockDisponible <= 0) {
        toast.error(`Sin stock disponible para "${product.name}"`);
        return prev;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku || "",
          unitPrice: product.salePrice,
          quantity: 1,
          maxDisponible: stockDisponible,
          subtotal: product.salePrice,
        },
      ];
    });
  }

  function updateQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const next = item.quantity + delta;
          if (next <= 0) return null;
          if (next > item.maxDisponible) {
            toast.error(`Disponible: ${item.maxDisponible}`);
            return item;
          }
          return { ...item, quantity: next, subtotal: item.unitPrice * next };
        })
        .filter(Boolean),
    );
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  async function handleSubmit() {
    if (cart.length === 0) { toast.error("Agregá productos al pedido"); return; }
    setSubmitting(true);
    setStockError(null);
    try {
      await pedidoService.createPedido({
        items: cart.map(({ productId, name, sku, unitPrice, quantity, subtotal: st }) => ({
          productId, name, sku, unitPrice, quantity, subtotal: st,
        })),
        subtotal,
        discountType: null,
        discountValue: 0,
        discount: 0,
        total: subtotal,
        paymentMethod: paymentMethod || null,
        clientId: selectedClientId || null,
        clientName: selectedClient?.name || null,
        notes: notes || null,
        userId,
      });
      toast.success("Pedido creado y stock reservado ✓");
      onCreated();
    } catch (err) {
      const msg = err?.message || "";
      if (msg.startsWith("INSUFFICIENT_STOCK_AVAILABLE:")) {
        const errors = parseStockError(msg);
        setStockError(errors);
      } else {
        toast.error("Error al crear el pedido");
        console.error(err);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-3xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-800">Nuevo pedido</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Product selector */}
          <div className="flex-1 flex flex-col border-r border-border min-w-0">
            <div className="p-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto…"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filtered.map((p) => {
                const disponible = p.stock - (p.stockReservado ?? 0);
                const isOut = disponible <= 0;
                const inCart = cart.find((i) => i.productId === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => !isOut && addToCart(p)}
                    disabled={isOut}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                      isOut
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                        : inCart
                        ? "border-primary bg-primary-light/10"
                        : "border-gray-100 bg-white hover:border-primary/30"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-primary font-semibold">{formatCurrency(p.salePrice)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-medium ${isOut ? "text-red-500" : disponible <= (p.minimumStock || 5) ? "text-amber-500" : "text-gray-500"}`}>
                        {isOut ? "Sin stock" : `Disp: ${disponible}`}
                      </p>
                      {inCart && (
                        <span className="text-[10px] font-semibold text-primary">{inCart.quantity} en pedido</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-72 flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Cart items */}
              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Seleccioná productos</p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.productId, -1)} className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white">
                          <span className="text-sm leading-none">−</span>
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, 1)} className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white">
                          <span className="text-sm leading-none">+</span>
                        </button>
                        <button onClick={() => setCart((p) => p.filter((i) => i.productId !== item.productId))} className="ml-1 h-6 w-6 rounded flex items-center justify-center text-gray-300 hover:text-danger">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Client */}
              <div>
                <label className="text-xs font-medium text-gray-500">Cliente</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none"
                >
                  <option value="">Cliente general</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Payment method (optional) */}
              <div>
                <label className="text-xs font-medium text-gray-500">Método de pago (opcional)</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none"
                >
                  <option value="">Definir al entregar</option>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-500">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej: Entregar a las 18hs, piso 3…"
                  className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Stock error */}
              {stockError && (
                <div className="rounded-lg bg-red-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-danger mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Stock insuficiente
                  </p>
                  {stockError.map((e, i) => (
                    <p key={i} className="text-xs text-danger">
                      <span className="font-medium">{e.name}</span>: disponible {e.disponible}, pedido {e.solicitado}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 space-y-3 shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando…</> : <><ClipboardList className="h-4 w-4" /> Crear pedido</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────
export default function Pedidos() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [summary, setSummary] = useState(null);

  const [selectedPedido, setSelectedPedido] = useState(null);
  const [deliverTarget, setDeliverTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [creating, setCreating] = useState(false);

  const [delivering, setDelivering] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadPedidos = useCallback(
    async (reset = false, cursor = null) => {
      setLoading(true);
      try {
        const result = await pedidoService.getPedidos({
          statusFilter,
          pageSize: PAGE_SIZE,
          lastDoc: cursor,
        });
        if (reset) {
          setPedidos(result.pedidos);
        } else {
          setPedidos((prev) => [...prev, ...result.pedidos]);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        if (reset) setPage(1);
      } catch (err) {
        const msg = err?.message || "";
        if (msg.includes("requires an index")) {
          toast.error("Se necesita crear un índice en Firebase. Revisá la consola del navegador.", { duration: 8000 });
        } else {
          toast.error("Error al cargar los pedidos");
        }
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  const loadSummary = useCallback(async () => {
    try {
      const s = await pedidoService.getPedidosSummary();
      setSummary(s);
    } catch (err) {
      console.error("Error loading summary:", err);
      setSummary(null);
    }
  }, []);

  useEffect(() => { loadPedidos(true); }, [loadPedidos]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  function refresh() {
    loadPedidos(true);
    loadSummary();
  }

  async function handleStatusChange(pedido, newStatus) {
    try {
      await pedidoService.updatePedidoStatus(pedido.id, newStatus, { userId: user?.uid });
      setPedidos((prev) =>
        prev.map((p) => p.id === pedido.id ? { ...p, status: newStatus } : p),
      );
      toast.success(newStatus === "in_progress" ? "Pedido en preparación" : "Estado actualizado");
      loadSummary();
    } catch (err) {
      toast.error("Error al actualizar el estado");
    }
  }

  async function handleDeliver(paymentMethod, onError) {
    if (!deliverTarget) return;
    setDelivering(true);
    try {
      await pedidoService.updatePedidoStatus(deliverTarget.id, "delivered", {
        paymentMethod,
        userId: user?.uid,
      });
      toast.success("Pedido entregado ✓ — Venta registrada en Historial");
      setPedidos((prev) =>
        prev.map((p) => p.id === deliverTarget.id ? { ...p, status: "delivered", paymentMethod } : p),
      );
      setDeliverTarget(null);
      loadSummary();
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("INSUFFICIENT_STOCK")) {
        onError(err);
      } else if (msg === "MISSING_PAYMENT_METHOD") {
        toast.error("Seleccioná el método de pago");
      } else {
        toast.error("Error al procesar la entrega");
        console.error(err);
      }
    } finally {
      setDelivering(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await pedidoService.updatePedidoStatus(cancelTarget.id, "cancelled", { userId: user?.uid });
      toast.success("Pedido cancelado — stock liberado");
      setPedidos((prev) =>
        prev.map((p) => p.id === cancelTarget.id ? { ...p, status: "cancelled" } : p),
      );
      setCancelTarget(null);
      loadSummary();
    } catch (err) {
      toast.error("Error al cancelar el pedido");
    } finally {
      setCancelling(false);
    }
  }

  const filteredPedidos = useMemo(() => {
    if (statusFilter === "all") return pedidos;
    return pedidos.filter((p) => p.status === statusFilter);
  }, [pedidos, statusFilter]);

  return (
    <PageContainer title="Pedidos" description="Gestión de pedidos con reserva de stock">
      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Clock}
          title="Pendientes"
          value={summary?.pending ?? "—"}
          kind="number"
        />
        <StatCard
          icon={Loader2}
          title="En preparación"
          value={summary?.inProgress ?? "—"}
          kind="number"
        />
        <StatCard
          icon={ClipboardList}
          title="Activos total"
          value={summary?.total ?? "—"}
          kind="number"
        />
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "all", label: "Todos" },
          { value: "pending", label: "Pendientes" },
          { value: "in_progress", label: "En preparación" },
          { value: "delivered", label: "Entregados" },
          { value: "cancelled", label: "Cancelados" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border lg:block">
        {loading && pedidos.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredPedidos.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No hay pedidos"
            description="Los pedidos que crees aparecerán acá"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  {["Fecha", "Productos", "Cliente", "Pago", "Total", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPedidos.map((pedido) => {
                  const isActive = pedido.status === "pending" || pedido.status === "in_progress";
                  const isPending = pedido.status === "pending";
                  return (
                    <tr key={pedido.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 text-xs">{formatDate(pedido.createdAt)}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-gray-800" title={pedido.items?.map((i) => i.name).join(", ")}>
                        {productsSummary(pedido.items)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {pedido.clientName || <span className="text-gray-400">General</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <PaymentBadge method={pedido.paymentMethod} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {formatCurrency(pedido.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={pedido.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedPedido(pedido)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-primary-light hover:text-primary"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isPending && (
                            <button
                              onClick={() => handleStatusChange(pedido, "in_progress")}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                              title="Pasar a En preparación"
                            >
                              <Loader2 className="h-4 w-4" />
                            </button>
                          )}
                          {isActive && (
                            <button
                              onClick={() => setDeliverTarget(pedido)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                              title="Marcar como entregado"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                          {isActive && (
                            <button
                              onClick={() => setCancelTarget(pedido)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-danger/10 hover:text-danger"
                              title="Cancelar pedido"
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

        {filteredPedidos.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-gray-500">Página {page}</p>
            <div className="flex gap-2">
              <button onClick={() => { if (page > 1) setPage((p) => p - 1); }} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <button onClick={() => { if (hasMore && lastDoc) { setPage((p) => p + 1); loadPedidos(false, lastDoc); } }} disabled={!hasMore} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {loading && pedidos.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredPedidos.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No hay pedidos" description="Creá tu primer pedido" />
        ) : (
          filteredPedidos.map((pedido) => {
            const isActive = pedido.status === "pending" || pedido.status === "in_progress";
            const isPending = pedido.status === "pending";
            return (
              <div key={pedido.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(pedido.total)}</span>
                      <StatusBadge status={pedido.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{formatDateShort(pedido.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button onClick={() => setSelectedPedido(pedido)} className="rounded-lg p-1.5 text-gray-400 hover:bg-primary-light hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </button>
                    {isPending && (
                      <button onClick={() => handleStatusChange(pedido, "in_progress")} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                        <Loader2 className="h-4 w-4" />
                      </button>
                    )}
                    {isActive && (
                      <button onClick={() => setDeliverTarget(pedido)} className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600">
                        <Truck className="h-4 w-4" />
                      </button>
                    )}
                    {isActive && (
                      <button onClick={() => setCancelTarget(pedido)} className="rounded-lg p-1.5 text-gray-400 hover:bg-danger/10 hover:text-danger">
                        <Ban className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-gray-400" />
                    {pedido.items?.length || 0} producto{(pedido.items?.length || 0) !== 1 ? "s" : ""}
                  </span>
                  <PaymentBadge method={pedido.paymentMethod} />
                  <span>{pedido.clientName || "General"}</span>
                </div>
                {pedido.items?.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500 truncate">{productsSummary(pedido.items)}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {selectedPedido && (
        <PedidoDetailModal pedido={selectedPedido} onClose={() => setSelectedPedido(null)} />
      )}
      {deliverTarget && (
        <DeliverConfirmModal
          pedido={deliverTarget}
          onConfirm={handleDeliver}
          onClose={() => setDeliverTarget(null)}
          delivering={delivering}
        />
      )}
      {cancelTarget && (
        <CancelConfirmDialog
          pedido={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          cancelling={cancelling}
        />
      )}
      {creating && (
        <CreatePedidoModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); refresh(); }}
          userId={user?.uid}
        />
      )}
    </PageContainer>
  );
}
