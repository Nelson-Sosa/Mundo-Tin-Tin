export function calculateDiscount(subtotal, discountType, discountValue) {
  if (discountType === "none" || !discountValue) return 0;
  
  const val = parseFloat(discountValue);
  if (isNaN(val) || val <= 0) return 0;
  
  if (discountType === "percentage") {
    // Math.min to ensure discount doesn't exceed subtotal
    return Math.min(subtotal * (val / 100), subtotal);
  }
  
  // Fixed discount, also cap at subtotal
  return Math.min(val, subtotal);
}
