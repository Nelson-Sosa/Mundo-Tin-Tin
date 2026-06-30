import { useState, useMemo } from "react";
import { Plus, ShieldBan } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import * as categoryService from "../../services/categoryService";
import { ValidationError } from "../../services/categoryService";

import PageContainer from "../../components/layout/PageContainer";
import SectionHeader from "../../components/ui/SectionHeader";
import EmptyState from "../../components/ui/EmptyState";

import {
  CategoryCard,
  CategoryTable,
  CategoryForm,
  CategoryModal,
  CategorySearch,
  CategoriesFilter,
  DeleteCategoryDialog,
  EmptyCategories,
} from "../../components/categories";
import { matchCategory } from "../../utils/categoryValidation";

export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { categories, loading, reload } = useCategories();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    let result = categories;

    if (filter !== "all") {
      result = result.filter((c) => c.status === filter);
    }

    if (search.trim()) {
      result = result.filter((c) => matchCategory(search, c));
    }

    return result;
  }, [categories, search, filter]);

  function openCreateModal() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEditModal(cat) {
    setEditingCategory(cat);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategory(null);
  }

  async function handleSubmit(formData) {
    setModalLoading(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(
          editingCategory.id,
          formData,
          user.uid
        );
        toast.success("Categoría actualizada correctamente");
      } else {
        await categoryService.createCategory(formData, user.uid);
        toast.success("Categoría creada correctamente");
      }
      closeModal();
      reload();
    } catch (err) {
      if (err instanceof ValidationError) {
        toast.error("Corrige los errores en el formulario");
      } else if (err.message === "DUPLICATE_NAME") {
        toast.error("Ya existe una categoría con ese nombre");
      } else {
        toast.error("Ocurrió un error al guardar la categoría");
      }
    } finally {
      setModalLoading(false);
    }
  }

  function confirmDelete(cat) {
    setDeleteTarget(cat);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await categoryService.deleteCategory(deleteTarget.id);
      toast.success("Categoría eliminada correctamente");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      if (err.message === "CATEGORY_IN_USE") {
        toast.error(
          "No puedes eliminar esta categoría porque tiene productos asociados."
        );
      } else {
        toast.error("Ocurrió un error al eliminar la categoría");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleToggleStatus(cat) {
    const newStatus = cat.status === "active" ? "inactive" : "active";
    try {
      await categoryService.toggleCategoryStatus(cat.id, newStatus, user.uid);
      toast.success(
        newStatus === "active"
          ? "Categoría activada correctamente"
          : "Categoría desactivada correctamente"
      );
      reload();
    } catch {
      toast.error("Ocurrió un error al cambiar el estado");
    }
  }

  if (!isAdmin) {
    return (
      <PageContainer title="Categorías">
        <EmptyState
          icon={ShieldBan}
          title="Acceso restringido"
          description="Solo los administradores pueden gestionar categorías."
        />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer title="Categorías" description="Gestión de categorías de productos">
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
    <PageContainer title="Categorías" description="Gestión de categorías de productos">
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
              Nueva categoría
            </button>
          }
        />

        {categories.length === 0 ? (
          <EmptyCategories onCreate={openCreateModal} />
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <CategorySearch value={search} onChange={setSearch} />
              </div>
              <CategoriesFilter value={filter} onChange={setFilter} />
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-border">
                <p className="text-sm text-gray-500">
                  {search
                    ? "No se encontraron categorías con ese criterio de búsqueda"
                    : "No hay categorías en este filtro"}
                </p>
              </div>
            ) : (
              <>
                <div className="sm:hidden">
                  <div className="grid gap-4">
                    {filtered.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        category={cat}
                        onEdit={openEditModal}
                        onToggleStatus={handleToggleStatus}
                        onDelete={confirmDelete}
                      />
                    ))}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <CategoryTable
                    categories={filtered}
                    onEdit={openEditModal}
                    onToggleStatus={handleToggleStatus}
                    onDelete={confirmDelete}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={closeModal}
        title={editingCategory ? "Editar categoría" : "Nueva categoría"}
      >
        <CategoryForm
          initialData={editingCategory}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={modalLoading}
        />
      </CategoryModal>

      <DeleteCategoryDialog
        open={!!deleteTarget}
        categoryName={deleteTarget?.name || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </PageContainer>
  );
}
