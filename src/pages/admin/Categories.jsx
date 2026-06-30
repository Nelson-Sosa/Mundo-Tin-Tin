import { Tags } from "lucide-react";
import PageContainer from "../../components/layout/PageContainer";

export default function Categories() {
  return (
    <PageContainer title="Categorías" description="Gestión de categorías de productos">
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-soft bg-white py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
          <Tags className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-800">
          Módulo de Categorías
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Gestión de categorías disponible en la siguiente fase.
        </p>
      </div>
    </PageContainer>
  );
}
