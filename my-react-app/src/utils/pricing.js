export const FREE_DELIVERY_THRESHOLD = 500;
export const DELIVERY_FEE = 30;

export function computeSummary(items) {
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
  const itemsCount = items.reduce((s, i) => s + i.quantity, 0);
  const savings = items.reduce((s, i) => {
    const orig = i.original_price && i.original_price > i.price ? i.original_price : i.price;
    return s + (orig - i.price) * i.quantity;
  }, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  return { itemsCount, subtotal, savings, deliveryFee, total };
}

export function formatINR(value) {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}