import {
  Pencil,
  Copy,
  EyeOff,
  Eye,
  Trash2,
  ImageOff,
  Search,
} from "lucide-react";
import ProductStatusBadge from "./ProductStatusBadge";
import StockBadge from "./StockBadge";
import { getImageUrl } from "../../services/cloudinary";
import { formatCurrency } from "../../utils/formatCurrency";

export default function ProductCard({ product, onEdit, onDuplicate, onToggleStatus, onDelete, onViewDetail }) {
  const mainImage = getImageUrl(product.images?.[0]);
  const isLowStock = product.stock <= product.minimumStock && product.stock > 0;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-border transition-all hover:shadow-md">
      <div className="flex gap-4 p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageOff className="h-6 w-6 text-gray-300" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-800">
              {product.name}
            </p>
            <ProductStatusBadge status={product.status} />
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{product.categoryName}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">
              {formatCurrency(product.salePrice)}
            </span>
            <span
              className={`text-xs font-medium ${
                isOutOfStock
                  ? "text-red-500"
                  : isLowStock
                  ? "text-amber-500"
                  : "text-gray-500"
              }`}
            >
              Stock: {product.stock}
            </span>
            <StockBadge stock={product.stock} minimumStock={product.minimumStock} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-border px-3 py-2">
        <button
          onClick={() => onViewDetail(product)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-sky-50 hover:text-sky-600"
        >
          <Search className="h-3.5 w-3.5" />
          Detalle
        </button>
        <button
          onClick={() => onEdit(product)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-primary-light hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          onClick={() => onDuplicate(product)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicar
        </button>
        <button
          onClick={() => onToggleStatus(product)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
        >
          {product.status === "active" ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {product.status === "active" ? "Desactivar" : "Activar"}
        </button>
        <button
          onClick={() => onDelete(product)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
}
