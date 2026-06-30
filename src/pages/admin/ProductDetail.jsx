import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  EyeOff,
  Eye,
  Trash2,
  ImageOff,
  Package,
  Tag,
  Layers,
  FileText,
  Clock,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import * as productService from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { getImageUrl } from "../../services/cloudinary";
import { formatCurrency } from "../../utils/formatCurrency";
import ProductStatusBadge from "../../components/products/ProductStatusBadge";
import StockBadge from "../../components/products/StockBadge";
import PageContainer from "../../components/layout/PageContainer";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategoryMap(Object.fromEntries(cats.map((c) => [c.id, c.name]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productService
      .getProductById(id)
      .then((data) => {
        if (!data) {
          toast.error("Producto no encontrado");
          navigate("/admin/productos");
          return;
        }
        setProduct(data);
      })
      .catch(() => {
        toast.error("Error al cargar el producto");
        navigate("/admin/productos");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageContainer title="Detalle del producto">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const mainImageUrl = getImageUrl(images[selectedImage]);
  const isActive = product.status === "active";
  const isLowStock = product.stock <= product.minimumStock && product.stock > 0;
  const isOutOfStock = product.stock <= 0;

  function formatDate(ts) {
    if (!ts) return "—";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("es-PY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleToggleStatus() {
    const newStatus = product.status === "active" ? "inactive" : "active";
    try {
      await productService.toggleProductStatus(product.id, newStatus, user.uid);
      toast.success(newStatus === "active" ? "Producto activado" : "Producto desactivado");
      setProduct((prev) => ({ ...prev, status: newStatus }));
    } catch {
      toast.error("Error al cambiar el estado");
    }
  }

  async function handleDelete() {
    try {
      await productService.deleteProduct(product.id);
      toast.success("Producto eliminado correctamente");
      navigate("/admin/productos");
    } catch {
      toast.error("Error al eliminar el producto");
    }
  }

  return (
    <PageContainer
      title={product.name}
      description="Vista detallada del producto"
    >
      <div className="space-y-6">
        {/* Barra de acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-border">
          <button
            onClick={() => navigate("/admin/productos")}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a productos
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/admin/productos")}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-light"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
            <button
              onClick={handleToggleStatus}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50"
            >
              {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isActive ? "Desactivar" : "Activar"}
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>

        {/* Galería + Info general */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Galería */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
              <div className="flex aspect-square items-center justify-center bg-gray-50 p-4">
                {mainImageUrl ? (
                  <img
                    src={mainImageUrl}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <ImageOff className="h-16 w-16" />
                    <span className="text-sm">Sin imagen</span>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 border-t border-border p-3">
                  {images.map((img, i) => {
                    const thumbUrl = getImageUrl(img);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                          i === selectedImage
                            ? "border-primary ring-1 ring-primary/30"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={`${product.name} ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <ImageOff className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Info general + comercial + inventario */}
          <div className="space-y-6 lg:col-span-3">
            {/* General */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-border">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                <Tag className="h-4 w-4" />
                Información General
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">Nombre</p>
                  <p className="mt-0.5 font-medium text-gray-800">{product.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Categoría</p>
                  <p className="mt-0.5 font-medium text-gray-800">
                    {categoryMap[product.categoryId] || "Sin categoría"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">SKU</p>
                  <p className="mt-0.5 font-mono text-sm text-gray-800">
                    {product.sku || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Estado</p>
                  <div className="mt-0.5">
                    <ProductStatusBadge status={product.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Comercial */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-border">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                <Layers className="h-4 w-4" />
                Información Comercial
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">Precio de venta</p>
                  <p className="mt-0.5 text-lg font-bold text-gray-800">
                    {formatCurrency(product.salePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Precio de compra</p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {formatCurrency(product.purchasePrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Inventario */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-border">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                <BarChart3 className="h-4 w-4" />
                Inventario
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">Stock actual</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${
                        isOutOfStock
                          ? "text-red-500"
                          : isLowStock
                          ? "text-amber-500"
                          : "text-gray-800"
                      }`}
                    >
                      {product.stock}
                    </span>
                    <StockBadge stock={product.stock} minimumStock={product.minimumStock} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Stock mínimo</p>
                  <p className="mt-0.5 font-medium text-gray-800">
                    {product.minimumStock}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Atributos */}
        {product.attributes?.length > 0 && (
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
              <Package className="h-4 w-4" />
              Atributos
            </h3>
            <div className="mt-4 flex flex-wrap gap-6">
              {product.attributes.map((attr, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {attr.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(attr.values || [])
                      .filter((v) => v?.trim())
                      .map((val, j) => (
                        <span
                          key={j}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          {val}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Descripción */}
        {product.description && (
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
              <FileText className="h-4 w-4" />
              Descripción
            </h3>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {product.description}
            </p>
          </div>
        )}

        {/* Info del sistema */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-border">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            <Clock className="h-4 w-4" />
            Información del Sistema
          </h3>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400">Creado</p>
              <p className="mt-0.5 text-gray-700">{formatDate(product.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Actualizado</p>
              <p className="mt-0.5 text-gray-700">{formatDate(product.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Diálogo de confirmación para eliminar */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800">
                ¿Eliminar producto?
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Esta acción no se puede deshacer. Se eliminarán también sus imágenes.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
