import { Pencil, Copy, EyeOff, Eye, Trash2, ImageOff, Search } from "lucide-react";
import ProductStatusBadge from "./ProductStatusBadge";
import StockBadge from "./StockBadge";
import { getThumbImage } from "../../lib/cloudinary";
import { formatCurrency } from "../../utils/formatCurrency";

export default function ProductTable({ products, onEdit, onDuplicate, onToggleStatus, onDelete, onViewDetail }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50/50">
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Producto
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Categoría
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Precio Vta.
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Stock
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Estado
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((prod) => {
            const mainImage = getThumbImage(prod.images?.[0], 40);
            const isLowStock = prod.stock <= prod.minimumStock && prod.stock > 0;
            const isOutOfStock = prod.stock <= 0;

            return (
              <tr key={prod.id} className="transition-colors hover:bg-gray-50/50">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={prod.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageOff className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800 max-w-[200px]">
                        {prod.name}
                      </p>
                      {prod.sku && (
                        <p className="text-xs text-gray-400">SKU: {prod.sku}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-gray-600">{prod.categoryName}</span>
                </td>
                <td className="px-4 py-3.5 font-medium text-gray-800">
                  {formatCurrency(prod.salePrice)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isOutOfStock
                          ? "text-red-500"
                          : isLowStock
                          ? "text-amber-500"
                          : "text-gray-700"
                      }`}
                    >
                      {prod.stock}
                    </span>
                    <StockBadge stock={prod.stock} minimumStock={prod.minimumStock} />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <ProductStatusBadge status={prod.status} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewDetail(prod)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
                      title="Ver detalle"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(prod)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-primary-light hover:text-primary"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDuplicate(prod)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(prod)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                      title={prod.status === "active" ? "Desactivar" : "Activar"}
                    >
                      {prod.status === "active" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(prod)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
