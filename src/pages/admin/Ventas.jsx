import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Check, X, Package, ImageOff, Tag, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../hooks/useProducts";
import * as orderService from "../../services/orderService";
import * as clientService from "../../services/clientService";
import { getCategories } from "../../services/categoryService";
import { formatCurrency } from "../../utils/formatCurrency";
import { getThumbImage } from "../../lib/cloudinary";
import PageContainer from "../../components/layout/PageContainer";

function ProductCard({ product, cart, onAddToCart }) {
  const isOut = product.stock <= 0;
  const threshold = product.minimumStock || 5;
  const isLow = product.stock > 0 && product.stock <= threshold;
  const inCart = cart.find((i) => i.productId === product.id);
  const imageUrl = product.images?.[0] ? getThumbImage(product.images[0], 64) : null;

  return (
    <button
      onClick={() => !isOut && onAddToCart(product)}
      disabled={isOut}
      className={`relative flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all active:scale-[0.98] sm:gap-3 sm:p-4 ${
        isOut
          ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
          : inCart
          ? "border-primary bg-primary-light/20 shadow-sm ring-1 ring-primary/20"
          : "border-gray-200 bg-white hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      {inCart && (
        <span className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-sm sm:h-7 sm:w-7">
          <Check className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
        </span>
      )}
      {inCart && (
        <span className="absolute -right-2 bottom-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white sm:hidden">
          {inCart.quantity}
        </span>
      )}
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg sm:h-16 sm:w-16 ${
        imageUrl ? "" : "bg-gray-100"
      } ${inCart ? "p-1" : ""}`}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="h-full w-full rounded-lg object-cover" />
        ) : (
          <Package className="h-6 w-6 text-gray-300 sm:h-7 sm:w-7" />
        )}
      </div>
      <div className="min-w-0 flex-1 sm:mt-2">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
          {product.name}
        </p>
        <p className="mt-0.5 text-sm font-bold text-primary sm:mt-1 sm:text-base">
          {formatCurrency(product.salePrice)}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:justify-center">
          {isOut ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
              <X className="h-3 w-3" />
              Sin stock
            </span>
          ) : isLow ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Stock: {product.stock}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              Stock: {product.stock}
            </span>
          )}
          {inCart && !isOut && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {inCart.quantity} en carrito
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function CartPanel({
  variant = "desktop",
  onClose,
  cart,
  cartItemCount,
  clients,
  selectedClientId,
  onClientIdChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  paymentMethod,
  onPaymentMethodChange,
  subtotal,
  discount,
  total,
  submitting,
  onConfirmSale,
  onClearCart,
  onUpdateQuantity,
  onRemoveFromCart,
}) {
  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between border-b border-border ${
        variant === "sheet" ? "px-4 py-3.5" : "px-5 py-4"
      }`}>
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
            <button onClick={onClearCart} className="text-xs font-medium text-red-500 hover:text-red-600">
              Vaciar
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-10 w-10 text-gray-200" />
            <p className="mt-3 text-sm text-gray-400">Carrito vacío</p>
            <p className="text-xs text-gray-300">Buscá productos y agregalos acá</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {cart.map((item) => (
              <li key={item.productId} className="flex items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-5 sm:py-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} c/u</p>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.productId, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 sm:h-8 sm:w-8"
                  >
                    <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                  <span className="flex h-7 min-w-[28px] items-center justify-center text-xs font-semibold text-gray-800 sm:h-8 sm:min-w-[36px] sm:text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8"
                  >
                    <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
                <div className="text-right min-w-[65px] sm:min-w-[75px]">
                  <p className="text-xs font-semibold text-gray-800 sm:text-sm">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveFromCart(item.productId)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 sm:h-8 sm:w-8"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t border-border bg-white px-4 py-4 space-y-3.5 md:px-5">
          <div>
            <label className="text-xs font-medium text-gray-500">Cliente</label>
            <select
              value={selectedClientId}
              onChange={(e) => onClientIdChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Cliente general</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Descuento</label>
            <div className="mt-1 flex gap-2">
              <select
                value={discountType}
                onChange={(e) => onDiscountTypeChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="none">Sin desc.</option>
                <option value="percentage">%</option>
                <option value="fixed">Fijo</option>
              </select>
              {discountType !== "none" && (
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={discountValue}
                    onChange={(e) => onDiscountValueChange(e.target.value)}
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
                onClick={() => onPaymentMethodChange("cash")}
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
                onClick={() => onPaymentMethodChange("transfer")}
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
          </div>

          <div className="rounded-lg bg-gray-50 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-800 font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Descuento</span>
                <span className="text-red-500 font-medium">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-200 pt-1.5">
              <span className="text-base font-bold text-gray-800">Total</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={onConfirmSale}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
}

export default function Ventas() {
  const { user } = useAuth();
  const { products, loading } = useProducts();
  const searchRef = useRef(null);
  const sheetRef = useRef(null);
  const desktopCartRef = useRef(null);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clients, setClients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(cats.filter((c) => c.status === "active")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    clientService.getClients()
      .then(setClients)
      .catch(() => {});
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
    let result = products.filter((p) => p.status === "active");

    if (activeCategory !== "all") {
      result = result.filter((p) => p.categoryId === activeCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          q.split(" ").every((w) => p.name.toLowerCase().includes(w))
      );
    }

    return result;
  }, [products, search, activeCategory]);

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
    setSelectedClientId("");
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
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientName = selectedClient?.name || "";

  async function handleConfirmSale() {
    if (cart.length === 0) {
      toast.error("Agregá productos al carrito");
      return;
    }
    setSubmitting(true);
    try {
      await orderService.createOrder({
        items: cart.map(({ productId, name, sku, unitPrice, quantity }) => ({
          productId, name, sku, unitPrice, quantity,
          subtotal: unitPrice * quantity,
        })),
        subtotal,
        discountType: discountType === "none" ? null : discountType,
        discountValue: discountType === "none" ? 0 : parseFloat(discountValue) || 0,
        discount, total, paymentMethod,
        clientId: selectedClientId || null,
        clientName: clientName || null,
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
        console.error("Error al registrar venta:", err);
        toast.error("Error al registrar la venta");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <PageContainer title="Ventas" description="Registrar una venta">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 space-y-4">
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          </div>
          <div className="hidden md:block md:w-80 xl:w-96 h-96 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </PageContainer>
    );
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <PageContainer title="Ventas" description="Registrar una venta">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">

        {/* ── Panel izquierdo: productos ── */}
        <div className="flex-1 min-w-0 space-y-4 pb-28 lg:pb-0">

          {/* Buscador sticky en desktop */}
          <div className="lg:sticky lg:top-0 lg:z-10 lg:bg-background-secondary lg:pb-2 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-3.5 sm:h-5 sm:w-5" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto por nombre o SKU..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:py-4 sm:pl-12 sm:text-base"
              />
            </div>

            {/* Chips de categoría */}
            {categories.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap sm:px-3.5 sm:py-1.5 ${
                    activeCategory === "all"
                      ? "bg-primary-light text-primary border border-primary/30"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap sm:px-3.5 sm:py-1.5 ${
                      activeCategory === cat.id
                        ? "bg-primary text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} cart={cart} onAddToCart={addToCart} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm ring-1 ring-border">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                {search.trim() || activeCategory !== "all"
                  ? "No se encontraron productos activos"
                  : "No hay productos activos disponibles"}
              </p>
            </div>
          )}
        </div>

        {/* ── Panel carrito — laptop/desktop ── */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.1)] ring-1 ring-gray-200/80 max-h-[calc(100vh-10rem)]">
          <CartPanel
            variant="desktop"
            cart={cart}
            cartItemCount={cartItemCount}
            clients={clients}
            selectedClientId={selectedClientId}
            onClientIdChange={setSelectedClientId}
            discountType={discountType}
            onDiscountTypeChange={setDiscountType}
            discountValue={discountValue}
            onDiscountValueChange={setDiscountValue}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            subtotal={subtotal}
            discount={discount}
            total={total}
            submitting={submitting}
            onConfirmSale={handleConfirmSale}
            onClearCart={clearCart}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
          />
        </div>
      </div>

      {/* ── Mobile: Bottom bar flotante ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden sm:px-4 sm:py-3">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] sm:px-5 sm:py-3.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                  {cartItemCount}
                </span>
              </div>
              <span>Ver carrito</span>
            </div>
            <span>{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* ── Mobile/Tablet: Bottom sheet ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-2xl animate-slide-up"
          >
            <div className="flex shrink-0 justify-center pt-2 pb-0">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>
            <CartPanel
              variant="sheet"
              onClose={() => setCartOpen(false)}
              cart={cart}
              cartItemCount={cartItemCount}
              clients={clients}
              selectedClientId={selectedClientId}
              onClientIdChange={setSelectedClientId}
              discountType={discountType}
              onDiscountTypeChange={setDiscountType}
              discountValue={discountValue}
              onDiscountValueChange={setDiscountValue}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              subtotal={subtotal}
              discount={discount}
              total={total}
              submitting={submitting}
              onConfirmSale={handleConfirmSale}
              onClearCart={clearCart}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </PageContainer>
  );
}
