import { Warehouse } from "lucide-react";
import PageContainer from "../../components/layout/PageContainer";

export default function Inventory() {
  return (
    <PageContainer title="Inventario" description="Control de stock y almacén">
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-soft bg-white py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
          <Warehouse className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-800">
          Módulo de Inventario
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Control de inventario disponible en la siguiente fase.
        </p>
      </div>
    </PageContainer>
  );
}
