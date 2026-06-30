const VALID_CHAR_RANGE =
  /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛãõÃÕçÇ]/u;

export function sanitizeName(name) {
  if (typeof name !== "string") return "";
  return name.trim().replace(/\s+/g, " ");
}

export function sanitizeDescription(desc) {
  if (typeof desc !== "string") return "";
  return desc.trim().replace(/\s+/g, " ");
}

export function validateName(name) {
  const sanitized = sanitizeName(name);
  if (!sanitized) return "El nombre de la categoría es obligatorio.";
  if (sanitized.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (sanitized.length > 100) return "El nombre no puede superar los 100 caracteres.";
  if (!VALID_CHAR_RANGE.test(sanitized))
    return "El nombre contiene caracteres no válidos.";
  return null;
}

export function validateDescription(desc) {
  if (!desc || !desc.trim()) return null;
  const sanitized = sanitizeDescription(desc);
  if (sanitized.length > 200)
    return "La descripción no puede superar los 200 caracteres.";
  return null;
}

export function validateStatus(status) {
  if (!status || (status !== "active" && status !== "inactive"))
    return "El estado debe ser Activa o Inactiva.";
  return null;
}

export function validateCategory(data) {
  const sanitizedName = sanitizeName(data.name || "");
  const sanitizedDesc = sanitizeDescription(data.description || "");
  const status = data.status || "active";

  const errors = {};
  const nameErr = validateName(sanitizedName);
  if (nameErr) errors.name = nameErr;
  const descErr = validateDescription(sanitizedDesc);
  if (descErr) errors.description = descErr;
  const statusErr = validateStatus(status);
  if (statusErr) errors.status = statusErr;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: { name: sanitizedName, description: sanitizedDesc, status },
  };
}

export function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchCategory(query, category) {
  if (!query.trim()) return true;
  const q = normalizeText(query.trim());
  return (
    normalizeText(category.name).includes(q) ||
    normalizeText(category.description || "").includes(q)
  );
}
