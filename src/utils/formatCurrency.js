export function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `${Math.round(num).toLocaleString("es-PY")} Gs.`;
}
