import { Pencil, EyeOff, Eye, Trash2 } from "lucide-react";
import CategoryStatusBadge from "./CategoryStatusBadge";

export default function CategoryTable({ categories, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50/50">
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Nombre
            </th>
            <th className="hidden px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell">
              Descripción
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Estado
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categories.map((cat) => (
            <tr key={cat.id} className="transition-colors hover:bg-gray-50/50">
              <td className="px-5 py-4">
                <p className="font-medium text-gray-800">{cat.name}</p>
              </td>
              <td className="hidden px-5 py-4 sm:table-cell">
                <p className="truncate text-gray-500 max-w-xs">
                  {cat.description || "—"}
                </p>
              </td>
              <td className="px-5 py-4">
                <CategoryStatusBadge status={cat.status} />
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(cat)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-primary-light hover:text-primary"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onToggleStatus(cat)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                    title={cat.status === "active" ? "Desactivar" : "Activar"}
                  >
                    {cat.status === "active" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(cat)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
