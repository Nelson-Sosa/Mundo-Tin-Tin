import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Warehouse, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import PageContainer from "../../components/layout/PageContainer";
import { StockBadge } from "../../components/products";

function getStockStatus(stock, minimumStock) {
  if (stock <= 0) return "out";
  if (stock <= minimumStock) return "low";
  return "available";
}

export default function Inventory() {
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = useCallback(() => {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const processed = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q)
      );
    }

    if (stockFilter === "low") {
      result = result.filter((p) => getStockStatus(p.stock, p.minimumStock) === "low");
    } else if (stockFilter === "out") {
      result = result.filter((p) => getStockStatus(p.stock, p.minimumStock) === "out");
    }

    result = [...result].sort((a, b) => {
      const diff = a.stock - b.stock;
      return sortDir === "asc" ? diff : -diff;
    });

    return result;
  }, [products, search, stockFilter, sortDir]);

  const SortIcon = sortDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <PageContainer title="Inventario" description="Control de stock y almacén">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos</option>
            <option value="low">Stock bajo</option>
            <option value="out">Agotados</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : processed.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-soft bg-white py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <Warehouse className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">
              {products.length === 0
                ? "No hay productos"
                : "No se encontraron resultados"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {products.length === 0
                ? "Crea productos desde el módulo Productos."
                : "Intenta con otros filtros."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Producto
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                  <th className="px-4 py-3.5">
                    <button onClick={handleSort} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700">
                      Stock físico
                      <SortIcon className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-amber-600">Reservado</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">Disponible</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Stock mínimo</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processed.map((prod) => {
                  const status = getStockStatus(prod.stock, prod.minimumStock);
                  const stockColor =
                    status === "out"
                      ? "text-red-500"
                      : status === "low"
                      ? "text-amber-500"
                      : "text-gray-800";
                  return (
                    <tr
                      key={prod.id}
                      onClick={() => navigate(`/admin/productos/${prod.id}`)}
                      className="cursor-pointer transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3.5 font-medium text-gray-800">{prod.name}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{prod.sku || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-bold ${stockColor}`}>{prod.stock}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {(prod.stockReservado ?? 0) > 0 ? (
                          <span className="text-sm font-semibold text-amber-600">{prod.stockReservado}</span>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {(() => {
                          const disponible = prod.stock - (prod.stockReservado ?? 0);
                          const dispColor = disponible <= 0 ? "text-red-500" : disponible <= (prod.minimumStock || 5) ? "text-amber-500" : "text-emerald-600";
                          return <span className={`text-sm font-bold ${dispColor}`}>{disponible}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{prod.minimumStock}</td>
                      <td className="px-4 py-3.5">
                        <StockBadge stock={prod.stock} minimumStock={prod.minimumStock} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
