import { Eye, Pencil, ShoppingBag } from "lucide-react";

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(Number(value)).toLocaleString("es-PY")} Gs.`;
}

export default function ClientCard({ client, onView, onEdit }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-border sm:p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => onView(client.id)}
            className="text-sm font-semibold text-gray-800 transition-colors hover:text-primary text-left"
          >
            {client.name}
          </button>
          <p className="mt-0.5 text-xs text-gray-500">{client.phone || "Sin teléfono"}</p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onView(client.id)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-light hover:text-primary"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(client)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-light hover:text-primary"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 sm:mt-3 sm:gap-x-4">
        <span className="flex items-center gap-1">
          <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
          {client.orderCount || 0} compra{(client.orderCount || 0) !== 1 ? "s" : ""}
        </span>
        <span className="font-medium text-gray-800">
          {formatCurrency(client.totalSpent)}
        </span>
      </div>

      <p className="mt-1 text-[11px] text-gray-400 sm:mt-1.5">
        Última compra: {formatDate(client.lastPurchaseDate)}
      </p>
    </div>
  );
}
