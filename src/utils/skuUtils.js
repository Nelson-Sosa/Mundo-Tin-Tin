export function getCategoryPrefix(categoryName) {
  if (!categoryName) return "GEN";
  const normalized = categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return normalized.slice(0, 3) || "GEN";
}
