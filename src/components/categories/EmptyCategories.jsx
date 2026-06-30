import { PackageOpen, Plus } from "lucide-react";

export default function EmptyCategories({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-white px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
        <PackageOpen className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-gray-800">
        No hay categorías todavía
      </h3>
      <p className="mt-2 max-w-xs text-sm text-gray-500">
        Crea tu primera categoría para empezar a organizar los productos de tu negocio.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
      >
        <Plus className="h-4 w-4" />
        Crear categoría
      </button>
    </div>
  );
}
