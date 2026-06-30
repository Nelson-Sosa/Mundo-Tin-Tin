import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Check, X, Package } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../hooks/useProducts";
import * as orderService from "../../services/orderService";
import { formatCurrency } from "../../utils/formatCurrency";
import PageContainer from "../../components/layout/PageContainer";

export default function Ventas() {
  const { user } = useAuth();
  const { products, loading } = useProducts();
  const searchRef = useRef(null);
  const sheetRef = useRef(null);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [clientName, setClientName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") setCartOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (cartOpen && sheetRef.current) {
      sheetRef.current.scrollTop = 0;
    }
  }, [cartOpen]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, 20);
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        q.split(" ").every((w) => p.name.toLowerCase().includes(w))
    );
  }, [products, search]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku || "",
          unitPrice: product.salePrice,
          quantity: 1,
          maxStock: product.stock,
        },
      ];
    });
  }

  function updateQuantity(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const next = item.quantity + delta;
          if (next <= 0) return null;
          if (next > item.maxStock) {
            toast.error(`Stock disponible: ${item.maxStock}`);
            return item;
          }
          return { ...item, quantity: next };
        })
        .filter(Boolean)
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscountType("none");
    setDiscountValue("");
    setClientName("");
    setCartOpen(false);
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const discount = useMemo(() => {
    if (discountType === "none" || !discountValue) return 0;
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) return 0;
    if (discountType === "percentage") {
      return Math.min(subtotal * (val / 100), subtotal);
    }
    return Math.min(val, subtotal);
  }, [subtotal, discountType, discountValue]);

  const total = subtotal - discount;

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function handleConfirmSale() {
    if (cart.length === 0) {
      toast.error("Agregá productos al carrito");
      return;
    }
    if (paymentMethod === "transfer" && !clientName.trim()) {
      toast.error("Ingresá el nombre del cliente para transferencia");
      return;
    }

    setSubmitting(true);
    try {
      await orderService.createOrder({
        items: cart.map(({ productId, name, sku, unitPrice, quantity }) => ({
          productId,
          name,
          sku,
          unitPrice,
          quantity,
          subtotal: unitPrice * quantity,
        })),
        subtotal,
        discountType: discountType === "none" ? null : discountType,
        discountValue: discountType === "none" ? 0 : parseFloat(discountValue) || 0,
        discount,
        total,
        paymentMethod,
        clientName: clientName.trim() || null,
        userId: user.uid,
      });
      toast.success(`Venta registrada — Total: ${formatCurrency(total)}`);
      clearCart();
      setSearch("");
      searchRef.current?.focus();
    } catch (err) {
      const msg = err.message || "";
      if (msg.startsWith("INSUFFICIENT_STOCK:")) {
        const parts = msg.split(":");
        toast.error(`Stock insuficiente para "${parts[2] || parts[1]}"`);
      } else if (msg === "EMPTY_ORDER") {
        toast.error("El carrito está vacío");
      } else {
        toast.error("Error al registrar la venta");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function CartContent({ embedded }) {
    return (
      <>
        {/* Header */}
        {!embedded && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5 md:hidden">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-800">Carrito</h2>
              {cartItemCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs font-medium text-red-500 hover:text-red-600">
                  Vaciar
                </button>
              )}
              <button onClick={() => setCartOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        {embedded && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-800">Carrito</h2>
              {cartItemCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs font-medium text-red-500 hover:text-red-600">
                Vaciar
              </button>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">Carrito vacío</p>
              <p className="text-xs text-gray-300">Buscá productos y agregalos acá</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {cart.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex h-9 min-w-[40px] items-center justify-center text-sm font-semibold text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-right min-w-[85px]">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totales + formulario */}
        {cart.length > 0 && (
          <div className="border-t border-border px-4 py-4 space-y-4 md:px-5">
            <div>
              <label className="text-xs font-medium text-gray-500">Cliente (opcional)</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Cliente general"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Descuento</label>
              <div className="mt-1 flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="none">Sin desc.</option>
                  <option value="percentage">%</option>
                  <option value="fixed">Fijo</option>
                </select>
                {discountType !== "none" && (
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percentage" ? "Ej: 10" : "Ej: 5000"}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-8 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      {discountType === "percentage" ? "%" : "Gs"}
                    </span>
                  </div>
                )}
              </div>
              {discount > 0 && (
                <p className="mt-1 text-xs text-emerald-600">Descuento: -{formatCurrency(discount)}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Método de pago</label>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                    paymentMethod === "cash"
                      ? "border-primary bg-primary-light text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Banknote className="h-5 w-5" />
                  Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod("transfer")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                    paymentMethod === "transfer"
                      ? "border-primary bg-primary-light text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  Transferencia
                </button>
              </div>
              {paymentMethod === "transfer" && !clientName.trim() && (
                <p className="mt-1 text-xs text-amber-600">Ingresá el nombre del cliente para transferencia</p>
              )}
            </div>

            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-800">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Descuento</span>
                  <span className="text-red-500">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-1.5">
                <span className="text-base font-bold text-gray-800">Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmSale}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Confirmar venta — {formatCurrency(total)}
                </>
              )}
            </button>
          </div>
        )}
      </>
    );
  }

  if (loading) {
    return (
      <PageContainer title="Ventas" description="Registrar una venta">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
          <div className="hidden md:block md:w-80 lg:w-96 h-96 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Ventas" description="Registrar una venta">
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        {/* Panel productos — full en mobile, flex-1 en desktop */}
        <div className="flex-1 min-w-0 space-y-4 pb-24 md:pb-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre o SKU..."
              className="w-full rounded-xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-base text-gray-800 placeholder-gray-400 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {filteredProducts
              .filter((p) => p.status === "active")
              .map((product) => {
                const isOut = product.stock <= 0;
                const cartItem = cart.find((i) => i.productId === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => !isOut && addToCart(product)}
                    disabled={isOut}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all active:scale-[0.97] ${
                      isOut
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                        : cartItem
                        ? "border-primary bg-primary-light/30 shadow-sm"
                        : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    {cartItem && (
                      <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
                        {cartItem.quantity}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                      {product.name}
                    </p>
                    <p className="mt-1.5 text-base font-bold text-primary">
                      {formatCurrency(product.salePrice)}
                    </p>
                    <p className={`mt-1 text-[11px] ${isOut ? "text-red-500 font-medium" : "text-gray-400"}`}>
                      {isOut ? "Sin stock" : `Stock: ${product.stock}`}
                    </p>
                  </button>
                );
              })}
          </div>

          {filteredProducts.filter((p) => p.status === "active").length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm ring-1 ring-border">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                {search.trim()
                  ? "No se encontraron productos activos"
                  : "No hay productos activos disponibles"}
              </p>
            </div>
          )}
        </div>

        {/* Panel carrito — sidebar en md+, oculto en mobile */}
        <div className="hidden md:flex md:w-80 lg:w-96 flex-col rounded-xl bg-white shadow-sm ring-1 ring-border max-h-[calc(100vh-12rem)]">
          <CartContent embedded />
        </div>
      </div>

      {/* Bottom bar móvil — Ver carrito */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Ver carrito ({cartItemCount})</span>
            </div>
            <span>{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Bottom sheet carrito en mobile */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl animate-slide-up"
          >
            <CartContent />
          </div>
        </div>
      )}

      {/* Animación slide-up */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </PageContainer>
  );
}
