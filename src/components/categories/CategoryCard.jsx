import { Tags, Pencil, Trash2, EyeOff, Eye } from "lucide-react";
import CategoryStatusBadge from "./CategoryStatusBadge";

export default function CategoryCard({ category, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-border transition-all hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
              <Tags className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">
                {category.name}
              </p>
              {category.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          <CategoryStatusBadge status={category.status} />
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-border px-3 py-2">
        <button
          onClick={() => onEdit(category)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-primary-light hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          onClick={() => onToggleStatus(category)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
        >
          {category.status === "active" ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {category.status === "active" ? "Desactivar" : "Activar"}
        </button>
        <button
          onClick={() => onDelete(category)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
}
