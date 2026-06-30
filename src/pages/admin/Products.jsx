import { Package } from "lucide-react";
import PageContainer from "../../components/layout/PageContainer";

export default function Products() {
  return (
    <PageContainer title="Productos" description="Gestión de productos del catálogo">
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-soft bg-white py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-800">
          Módulo de Productos
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Gestión de productos disponible en la siguiente fase.
        </p>
      </div>
    </PageContainer>
  );
}
