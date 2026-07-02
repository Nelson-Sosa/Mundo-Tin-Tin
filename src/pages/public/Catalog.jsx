import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, SlidersHorizontal, X, Package } from "lucide-react";
import { getActiveProducts } from "../../services/publicProductService";
import ProductCard from "../../components/public/ProductCard";
import BottomSheet from "../../components/ui/BottomSheet";

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
  
  const [visibleCount, setVisibleCount] = useState(20);

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

  // Infinite Scroll Observer
  const observer = useRef();
  const lastElementRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCount < filtered.length) {
        setVisibleCount(prev => prev + 20);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, filtered.length, visibleCount]);

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [search, selectedCategory, sort]);

  const visibleProducts = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
          Catálogo de productos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Explorá todos nuestros productos disponibles
        </p>
      </div>

      {/* Sticky Search + Filter bar */}
      <div className="sticky top-0 z-30 space-y-2 bg-white pb-3 pt-1 sm:space-y-3">
        <div className="relative lg:max-w-lg">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-10 text-[16px] text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm"
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

        {/* Categorías y Botón de Filtros */}
        <div className="mb-4 flex sm:items-start items-center gap-4 sm:mb-5">
          {/* Scroll de categorías (móvil) / Wrap (desktop) */}
          <div className="flex flex-1 items-center overflow-x-auto sm:overflow-visible hide-scrollbar snap-x snap-mandatory py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:py-0">
            <div className="flex items-center sm:flex-wrap gap-2.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors sm:py-1.5 sm:px-3.5 sm:text-xs ${
                  selectedCategory === "all"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-gray-600 ring-1 ring-border hover:bg-primary-light hover:text-primary"
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors sm:py-1.5 sm:px-3.5 sm:text-xs ${
                    selectedCategory === cat
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-gray-600 ring-1 ring-border hover:bg-primary-light hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de orden/filtros */}
          <div className="relative flex shrink-0 items-center pl-1 sm:pl-0">
            {/* Gradiente sutil para separar visualmente en móvil si es necesario */}
            <div className="pointer-events-none absolute -left-6 bottom-0 top-0 w-6 bg-gradient-to-r from-transparent to-white lg:hidden" />
            
            <button
              onClick={() => setShowFilters(true)}
              className="relative flex items-center gap-1.5 rounded-full bg-white p-2.5 text-gray-600 shadow-sm ring-1 ring-border transition-colors hover:bg-primary-light hover:text-primary lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
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
      </div>

      {/* Bottom Sheet para Filtros y Orden (Mobile) */}
      <BottomSheet 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
        title="Filtros y Orden"
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Ordenar por</h3>
            <div className="flex flex-col gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSort(opt.value);
                    setShowFilters(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    sort === opt.value
                      ? "bg-primary-light text-primary ring-1 ring-primary/30"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                  {sort === opt.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Categorías</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setShowFilters(false);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-white"
                    : "bg-gray-50 text-gray-600 ring-1 ring-border hover:bg-primary-light"
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowFilters(false);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-white"
                      : "bg-gray-50 text-gray-600 ring-1 ring-border hover:bg-primary-light"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
              <div className="aspect-square animate-pulse bg-gray-100" />
              <div className="space-y-2 p-2.5 sm:p-4">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 sm:h-4" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100 sm:h-5" />
                <div className="mt-4 h-8 w-full animate-pulse rounded-lg bg-gray-100 sm:h-9" />
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleProducts.map((product, index) => {
            if (visibleProducts.length === index + 1) {
              return (
                <div ref={lastElementRef} key={product.id}>
                  <ProductCard product={product} />
                </div>
              );
            } else {
              return <ProductCard key={product.id} product={product} />;
            }
          })}
        </div>
      )}

      {/* Loading more indicator */}
      {!loading && visibleCount < filtered.length && (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="pb-8 text-center text-xs text-gray-400">
          Mostrando {visibleProducts.length} de {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

    </div>
  );
}

