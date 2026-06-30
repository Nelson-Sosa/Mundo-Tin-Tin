export function sanitizeText(text) {
  if (typeof text !== "string") return "";
  return text.trim().replace(/\s+/g, " ");
}

export function validateProductName(name) {
  const sanitized = sanitizeText(name);
  if (!sanitized) return "El nombre del producto es obligatorio.";
  if (sanitized.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (sanitized.length > 200) return "El nombre no puede superar los 200 caracteres.";
  return null;
}

export function validateCategory(categoryId, categories) {
  if (!categoryId) return "La categoría es obligatoria.";
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return "La categoría seleccionada no existe.";
  if (cat.status !== "active") return "No se puede asignar una categoría inactiva.";
  return null;
}

export function validatePurchasePrice(price) {
  const num = Number(price);
  if (isNaN(num)) return "El precio de compra debe ser un número válido.";
  if (num < 0) return "El precio de compra no puede ser negativo.";
  return null;
}

export function validateSalePrice(price) {
  const num = Number(price);
  if (isNaN(num)) return "El precio de venta debe ser un número válido.";
  if (num <= 0) return "El precio de venta debe ser mayor que cero.";
  return null;
}

export function validateStock(value, label) {
  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num)) return `${label} debe ser un número entero.`;
  if (num < 0) return `${label} no puede ser negativo.`;
  return null;
}

export function validateStatus(status) {
  if (!status || (status !== "active" && status !== "inactive"))
    return "El estado debe ser Activo o Inactivo.";
  return null;
}

export function validateSku(sku) {
  if (sku && sku.length > 50) return "El SKU no puede superar los 50 caracteres.";
  return null;
}

export function validateAttributes(attributes) {
  if (!attributes || attributes.length === 0) return null;

  const errors = {};
  attributes.forEach((attr, i) => {
    const name = sanitizeText(attr.name || "");
    if (!name) {
      errors[i] = "El nombre del atributo es obligatorio.";
      return;
    }

    const validValues = (attr.values || [])
      .map((v) => sanitizeText(v))
      .filter(Boolean);

    if (validValues.length === 0) {
      errors[i] = "Agrega al menos un valor o elimina este atributo.";
      return;
    }

    const seen = new Set();
    for (const v of validValues) {
      const normalized = v.toLowerCase();
      if (seen.has(normalized)) {
        errors[i] = `Valor duplicado: "${v}".`;
        return;
      }
      seen.add(normalized);
    }
  });

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateDescription(desc) {
  if (!desc || !desc.trim()) return null;
  const sanitized = sanitizeText(desc);
  if (sanitized.length > 500) return "La descripción no puede superar los 500 caracteres.";
  return null;
}

export function validateProduct(data, categories) {
  const sanitizedName = sanitizeText(data.name || "");
  const sanitizedDesc = sanitizeText(data.description || "");

  const errors = {};

  const nameErr = validateProductName(sanitizedName);
  if (nameErr) errors.name = nameErr;

  const catErr = validateCategory(data.categoryId, categories);
  if (catErr) errors.categoryId = catErr;

  const purchaseErr = validatePurchasePrice(data.purchasePrice);
  if (purchaseErr) errors.purchasePrice = purchaseErr;

  const saleErr = validateSalePrice(data.salePrice);
  if (saleErr) errors.salePrice = saleErr;

  const stockErr = validateStock(data.stock, "El stock inicial");
  if (stockErr) errors.stock = stockErr;

  const minStockErr = validateStock(data.minimumStock, "El stock mínimo");
  if (minStockErr) errors.minimumStock = minStockErr;

  const statusErr = validateStatus(data.status);
  if (statusErr) errors.status = statusErr;

  const skuErr = validateSku(data.sku);
  if (skuErr) errors.sku = skuErr;

  const descErr = validateDescription(sanitizedDesc);
  if (descErr) errors.description = descErr;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      name: sanitizedName,
      description: sanitizedDesc,
      categoryId: data.categoryId,
      sku: data.sku ? sanitizeText(data.sku) : "",
      purchasePrice: Number(data.purchasePrice),
      salePrice: Number(data.salePrice),
      stock: Number(data.stock) || 0,
      minimumStock: Number(data.minimumStock) || 0,
      status: data.status || "active",
    },
  };
}
