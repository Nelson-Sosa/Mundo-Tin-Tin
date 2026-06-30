export default function StockBadge({ stock, minimumStock }) {
  const isOutOfStock = stock <= 0;
  const isLowStock = stock <= minimumStock && stock > 0;
  const isAvailable = stock > minimumStock;

  if (isOutOfStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Sin stock
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Stock bajo
      </span>
    );
  }

  if (isAvailable) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Disponible
      </span>
    );
  }

  return null;
}
