import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ShieldBan } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../hooks/useProducts";
import * as productService from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { ValidationError } from "../../services/productService";
import { normalizeText } from "../../utils/categoryValidation";

import PageContainer from "../../components/layout/PageContainer";
import SectionHeader from "../../components/ui/SectionHeader";
import EmptyState from "../../components/ui/EmptyState";

import {
  ProductForm,
  ProductCard,
  ProductTable,
  ProductFilters,
  ProductSearch,
  DeleteProductDialog,
  EmptyProducts,
} from "../../components/products";

export default function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { products, loading, reload } = useProducts();
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    categoryId: "",
    status: "",
    lowStock: false,
    outOfStock: false,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const q = normalizeText(search.trim());
      result = result.filter(
        (p) =>
          normalizeText(p.name).includes(q) ||
          normalizeText(p.sku || "").includes(q)
      );
    }

    if (filters.categoryId) {
      result = result.filter((p) => p.categoryId === filters.categoryId);
    }

    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.lowStock) {
      result = result.filter(
        (p) => p.stock <= p.minimumStock && p.stock > 0
      );
    }

    if (filters.outOfStock) {
      result = result.filter((p) => p.stock === 0);
    }

    return result;
  }, [products, search, filters]);

  function openCreateModal() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEditModal(prod) {
    setEditingProduct(prod);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  async function handleSubmit(formData) {
    setModalLoading(true);
    try {
      const hasFiles = formData.images?.some((img) => img instanceof File);

      let uploadedImages = [];
      if (hasFiles) {
        const existingImages = formData.images.filter(
          (img) => !(img instanceof File)
        );
        const newFiles = formData.images.filter(
          (img) => img instanceof File
        );

        const uploadedObjects = await Promise.all(
          newFiles.map((file) => productService.uploadImage(file))
        );
        uploadedImages = [...existingImages, ...uploadedObjects];
      } else {
        uploadedImages = formData.images || [];
      }

      if (editingProduct) {
        await productService.updateProduct(
          editingProduct.id,
          { ...formData, images: uploadedImages },
          user.uid
        );
        toast.success("Producto actualizado correctamente");
      } else {
        await productService.createProduct(
          { ...formData, images: uploadedImages },
          user.uid
        );
        toast.success("Producto creado correctamente");
      }
      closeModal();
      reload();
    } catch (err) {
      if (err instanceof ValidationError) {
        toast.error("Corrige los errores en el formulario");
      } else if (err.message === "DUPLICATE_PRODUCT") {
        toast.error(
          "Ya existe un producto con ese nombre en la misma categoría"
        );
      } else if (err.message === "DUPLICATE_SKU") {
        toast.error("Ya existe un producto con ese SKU");
      } else {
        toast.error("Ocurrió un error al guardar el producto");
      }
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDuplicate(prod) {
    try {
      await productService.duplicateProduct(prod.id, user.uid);
      toast.success("Producto duplicado correctamente");
      reload();
    } catch {
      toast.error("Ocurrió un error al duplicar el producto");
    }
  }

  function handleViewDetail(prod) {
    navigate(`/admin/productos/${prod.id}`);
  }

  function confirmDelete(prod) {
    setDeleteTarget(prod);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await productService.deleteProduct(deleteTarget.id);
      toast.success("Producto eliminado correctamente");
      setDeleteTarget(null);
      reload();
    } catch {
      toast.error("Ocurrió un error al eliminar el producto");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleToggleStatus(prod) {
    const newStatus = prod.status === "active" ? "inactive" : "active";
    try {
      await productService.toggleProductStatus(prod.id, newStatus, user.uid);
      toast.success(
        newStatus === "active"
          ? "Producto activado correctamente"
          : "Producto desactivado correctamente"
      );
      reload();
    } catch {
      toast.error("Ocurrió un error al cambiar el estado");
    }
  }

  if (!isAdmin) {
    return (
      <PageContainer title="Productos">
        <EmptyState
          icon={ShieldBan}
          title="Acceso restringido"
          description="Solo los administradores pueden gestionar productos."
        />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer title="Productos" description="Gestión del catálogo de productos">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Productos" description="Gestión del catálogo de productos">
      <div className="space-y-6">
        <SectionHeader
          title=""
          description=""
          action={
            <button
              onClick={openCreateModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
          }
        />

        {products.length === 0 ? (
          <EmptyProducts onCreate={openCreateModal} />
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <ProductSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar por nombre o SKU..."
                />
              </div>
              <ProductFilters
                filters={filters}
                onChange={setFilters}
                categories={categories}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-border">
                <p className="text-sm text-gray-500">
                  {search || Object.values(filters).some(Boolean)
                    ? "No se encontraron productos con esos criterios"
                    : "No hay productos en este filtro"}
                </p>
              </div>
            ) : (
              <>
                <div className="sm:hidden">
                  <div className="grid gap-4">
                    {filtered.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onViewDetail={handleViewDetail}
                        onEdit={openEditModal}
                        onDuplicate={handleDuplicate}
                        onToggleStatus={handleToggleStatus}
                        onDelete={confirmDelete}
                      />
                    ))}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <ProductTable
                    products={filtered}
                    onViewDetail={handleViewDetail}
                    onEdit={openEditModal}
                    onDuplicate={handleDuplicate}
                    onToggleStatus={handleToggleStatus}
                    onDelete={confirmDelete}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal para crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 pt-4 pb-10 backdrop-blur-sm sm:items-center sm:pt-0">
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingProduct ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="px-6 py-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <ProductForm
                key={editingProduct?.id || "new"}
                initialData={editingProduct}
                categories={categories}
                onSubmit={handleSubmit}
                onCancel={closeModal}
                loading={modalLoading}
              />
            </div>
          </div>
        </div>
      )}

      <DeleteProductDialog
        open={!!deleteTarget}
        productName={deleteTarget?.name || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </PageContainer>
  );
}
