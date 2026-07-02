import { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, X, Package, AlertCircle } from "lucide-react";
import { getActiveProducts } from "../../services/publicProductService";
import ProductCard from "../../components/public/ProductCard";

const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
];

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getActiveProducts()
      .then((data) => {
        setProducts(data);
        const cats = [...new Set(data.map((p) => p.categoryName).filter(Boolean))];
        setCategories(cats.sort());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryName === selectedCategory);
    }

    switch (sort) {
      case "price-asc":
        result.sort((a, b) => (a.salePrice ?? 0) - (b.salePrice ?? 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.salePrice ?? 0) - (a.salePrice ?? 0));
        break;
      default:
        result.sort((a, b) => ((b.createdAt?.toMillis?.() ?? 0)) - ((a.createdAt?.toMillis?.() ?? 0)));
    }

    return result;
  }, [products, search, selectedCategory, sort]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
          Catálogo de productos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Explorá todos nuestros productos disponibles
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 ring-1 ring-border hover:bg-primary-light hover:text-primary"
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 ring-1 ring-border hover:bg-primary-light hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600 ring-1 ring-border transition-colors hover:bg-primary-light hover:text-primary lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Ordenar
            </button>

            <div className="hidden items-center gap-1 lg:flex">
              <span className="text-xs text-gray-400">Ordenar:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile sort selector */}
        {showFilters && (
          <div className="rounded-xl bg-white p-4 ring-1 ring-border lg:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Ordenar por
            </p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSort(opt.value);
                    setShowFilters(false);
                  }}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    sort === opt.value
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-primary-light hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
              <div className="aspect-square animate-pulse bg-gray-100" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
            {search || selectedCategory !== "all" ? (
              <Search className="h-8 w-8 text-primary" />
            ) : (
              <Package className="h-8 w-8 text-primary" />
            )}
          </div>
          <h3 className="mt-5 text-base font-semibold text-gray-800">
            {search || selectedCategory !== "all"
              ? "No encontramos productos"
              : "No hay productos disponibles"}
          </h3>
          <p className="mt-1.5 max-w-sm text-center text-sm text-gray-500">
            {search || selectedCategory !== "all"
              ? "Intenta con otros términos de búsqueda o seleccioná 'Todas' las categorías."
              : "Los productos aparecerán aquí cuando estén publicados."}
          </p>
          {(search || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
              }}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Product grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          {filtered.length} producto{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

    </div>
  );
}
