import { Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function ClientTable({ clients, onEdit }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Teléfono
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Compras
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total gastado
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Última compra
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr key={client.id} className="transition-colors hover:bg-gray-50/50">
                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    onClick={() => navigate(`/admin/clientes/${client.id}`)}
                    className="font-medium text-gray-800 transition-colors hover:text-primary"
                  >
                    {client.name}
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{client.phone || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{client.orderCount || 0}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">{formatCurrency(client.totalSpent)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(client.lastPurchaseDate)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/clientes/${client.id}`)}
                      className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-primary-light hover:text-primary"
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(client)}
                      className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-primary-light hover:text-primary"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
