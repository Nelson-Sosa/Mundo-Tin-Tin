import { useState, useEffect } from "react";
import {
  sanitizeText,
  validateProductName,
  validateDescription,
  validatePurchasePrice,
  validateSalePrice,
  validateStock,
  validateSku,
  validateAttributes,
} from "../../utils/productValidation";
import { getCategories } from "../../services/categoryService";
import { generateSku } from "../../services/productService";
import ProductGallery from "./ProductGallery";
import ProductAttributes from "./ProductAttributes";

function buildInitial(initialData) {
  if (!initialData) {
    return {
      name: "",
      description: "",
      categoryId: "",
      sku: "",
      purchasePrice: "",
      salePrice: "",
      stock: "0",
      minimumStock: "0",
      status: "active",
      images: [],
      attributes: [],
    };
  }
  return {
    name: initialData.name || "",
    description: initialData.description || "",
    categoryId: initialData.categoryId || "",
    sku: initialData.sku || "",
    purchasePrice: initialData.purchasePrice?.toString() || "",
    salePrice: initialData.salePrice?.toString() || "",
    stock: initialData.stock?.toString() || "0",
    minimumStock: initialData.minimumStock?.toString() || "0",
    status: initialData.status || "active",
    images: initialData.images || [],
    attributes: initialData.attributes || [],
  };
}

export default function ProductForm({ initialData, categories, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(() => buildInitial(initialData));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [categoryList, setCategoryList] = useState(categories || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);

  useEffect(() => {
    if (!categories) {
      getCategories().then(setCategoryList).catch(() => {});
    }
  }, [categories]);

  function handleChange(field, value) {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) validateField(field, value);
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, form[field]);
  }

  function validateField(field, value) {
    let err = null;
    switch (field) {
      case "name":
        err = validateProductName(sanitizeText(value));
        break;
      case "description":
        err = validateDescription(value);
        break;
      case "purchasePrice":
        err = validatePurchasePrice(value);
        break;
      case "salePrice":
        err = validateSalePrice(value);
        break;
      case "stock":
        err = validateStock(value, "El stock inicial");
        break;
      case "minimumStock":
        err = validateStock(value, "El stock mínimo");
        break;
      case "sku":
        err = validateSku(value);
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
  }

  function handleImagesChange(images) {
    setForm((prev) => ({ ...prev, images }));
  }

  async function handleCategoryChange(categoryId) {
    handleChange("categoryId", categoryId);
    setErrors((prev) => ({ ...prev, categoryId: null }));

    if (!initialData && categoryId && !skuManuallyEdited) {
      const category = categoryList.find((c) => c.id === categoryId);
      if (category) {
        try {
          const sku = await generateSku(category.name);
          setForm((prev) => ({ ...prev, sku }));
        } catch {
          // si falla la generación, el usuario puede ingresarlo manualmente
        }
      }
    }
  }

  function handleAttributesChange(attributes) {
    setForm((prev) => ({ ...prev, attributes }));
    setErrors((prev) => {
      const { attributes: attrErr, ...rest } = prev;
      return rest;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const fieldsToValidate = [
      "name", "description", "purchasePrice", "salePrice",
      "stock", "minimumStock", "sku",
    ];
    const newErrors = {};
    for (const f of fieldsToValidate) {
      const err = validateFieldInternal(f, form[f]);
      if (err) newErrors[f] = err;
    }
    if (!form.categoryId) newErrors.categoryId = "La categoría es obligatoria.";

    const attrErrors = validateAttributes(form.attributes);
    if (attrErrors) newErrors.attributes = attrErrors;

    setErrors(newErrors);
    setTouched(Object.fromEntries(fieldsToValidate.map((f) => [f, true])));

    if (Object.keys(newErrors).length > 0) return;

    if (form.images.some((img) => img instanceof File)) {
      setUploadingImages(true);
    }

    onSubmit({
      ...form,
      name: sanitizeText(form.name),
      description: sanitizeText(form.description),
      sku: form.sku ? sanitizeText(form.sku) : "",
      purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice),
      stock: Number(form.stock) || 0,
      minimumStock: Number(form.minimumStock) || 0,
    });
  }

  function validateFieldInternal(field, value) {
    switch (field) {
      case "name": return validateProductName(sanitizeText(value));
      case "description": return validateDescription(value);
      case "purchasePrice": return validatePurchasePrice(value);
      case "salePrice": return validateSalePrice(value);
      case "stock": return validateStock(value, "El stock inicial");
      case "minimumStock": return validateStock(value, "El stock mínimo");
      case "sku": return validateSku(value);
      default: return null;
    }
  }

  const activeCategories = categoryList.filter((c) => c.status === "active");

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* INFORMACIÓN GENERAL */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Información General
        </h3>
        <div className="mt-4 space-y-5">
          <div>
            <label htmlFor="prod-name" className="block text-sm font-medium text-gray-700">
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              id="prod-name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }`}
              placeholder="Ej: Remera Oversize"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="prod-cat" className="block text-sm font-medium text-gray-700">
              Categoría <span className="text-danger">*</span>
            </label>
            <select
              id="prod-cat"
              value={form.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, categoryId: true }))}
              className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                errors.categoryId
                  ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }`}
            >
              <option value="">Seleccionar categoría</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
            {!initialData && activeCategories.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No hay categorías activas. Crea una categoría primero.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="prod-purchase" className="block text-sm font-medium text-gray-700">
                Precio de compra <span className="text-danger">*</span>
              </label>
              <input
                id="prod-purchase"
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", e.target.value)}
                onBlur={() => handleBlur("purchasePrice")}
                className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                  errors.purchasePrice
                    ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                    : "border-gray-200 focus:border-primary focus:ring-primary/20"
                }`}
                placeholder="0.00"
              />
              {errors.purchasePrice && <p className="mt-1 text-xs text-red-500">{errors.purchasePrice}</p>}
            </div>
            <div>
              <label htmlFor="prod-sale" className="block text-sm font-medium text-gray-700">
                Precio de venta <span className="text-danger">*</span>
              </label>
              <input
                id="prod-sale"
                type="number"
                min="0.01"
                step="0.01"
                value={form.salePrice}
                onChange={(e) => handleChange("salePrice", e.target.value)}
                onBlur={() => handleBlur("salePrice")}
                className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                  errors.salePrice
                    ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                    : "border-gray-200 focus:border-primary focus:ring-primary/20"
                }`}
                placeholder="0.00"
              />
              {errors.salePrice && <p className="mt-1 text-xs text-red-500">{errors.salePrice}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="prod-desc" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="prod-desc"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              onBlur={() => handleBlur("description")}
              className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 resize-none ${
                errors.description
                  ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }`}
              placeholder="Descripción opcional"
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            {form.description && (
              <p className="mt-1 text-right text-xs text-gray-400">
                {form.description.length}/500
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="prod-sku" className="block text-sm font-medium text-gray-700">
                SKU
              </label>
              <input
                id="prod-sku"
                type="text"
                value={form.sku}
                onChange={(e) => {
                  handleChange("sku", e.target.value);
                  setSkuManuallyEdited(true);
                }}
                onBlur={() => handleBlur("sku")}
                className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 ${
                  errors.sku
                    ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                    : "border-gray-200 focus:border-primary focus:ring-primary/20"
                }`}
                placeholder="Ej: REM-0001"
              />
              {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="prod-status" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="prod-status"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* IMÁGENES */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Imágenes
        </h3>
        <div className="mt-4">
          <ProductGallery
            images={form.images}
            onChange={handleImagesChange}
            uploading={uploadingImages}
          />
        </div>
      </div>

      {/* INVENTARIO MVP */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Inventario
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          El stock será administrado desde el módulo Inventario en futuras versiones.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="prod-stock" className="block text-sm font-medium text-gray-700">
              Stock inicial <span className="text-danger">*</span>
            </label>
            <input
              id="prod-stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
              onBlur={() => handleBlur("stock")}
              className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                errors.stock
                  ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }`}
              placeholder="0"
            />
            {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}
          </div>
          <div>
            <label htmlFor="prod-minstock" className="block text-sm font-medium text-gray-700">
              Stock mínimo <span className="text-danger">*</span>
            </label>
            <input
              id="prod-minstock"
              type="number"
              min="0"
              step="1"
              value={form.minimumStock}
              onChange={(e) => handleChange("minimumStock", e.target.value)}
              onBlur={() => handleBlur("minimumStock")}
              className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 transition-colors focus:outline-none focus:ring-2 ${
                errors.minimumStock
                  ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                  : "border-gray-200 focus:border-primary focus:ring-primary/20"
              }`}
              placeholder="0"
            />
            {errors.minimumStock && <p className="mt-1 text-xs text-red-500">{errors.minimumStock}</p>}
          </div>
        </div>
      </div>

      {/* ATRIBUTOS */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Atributos (Opcional)
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          Agrega atributos como Color, Talle, Calce, etc. En futuras fases podrán convertirse en variantes con stock independiente.
        </p>
        <div className="mt-4">
          <ProductAttributes
            attributes={form.attributes}
            onChange={handleAttributesChange}
            errors={errors.attributes}
          />
        </div>
      </div>

      {/* ACCIONES */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {loading
            ? "Guardando..."
            : initialData
            ? "Guardar cambios"
            : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
