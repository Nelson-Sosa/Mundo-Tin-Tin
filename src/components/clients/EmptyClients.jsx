import { Users } from "lucide-react";
import EmptyState from "../ui/EmptyState";

export default function EmptyClients({ onCreate }) {
  return (
    <EmptyState
      icon={Users}
      title="No hay clientes registrados"
      description="Los clientes que registres aparecerán aquí. También podés seleccionarlos al realizar una venta."
      action={
        <button
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          Registrar primer cliente
        </button>
      }
    />
  );
}
