export function formatBs(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
  return `Bs. ${formatted}`;
}

export function formatBsShort(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `Bs ${Math.round(safe)}`;
}

export function formatQuantity(qty: number, unit: string): string {
  const safe = Number.isFinite(qty) ? qty : 0;
  const decimals = unit === "u" && Number.isInteger(safe) ? 0 : 2;
  const text = safe.toFixed(decimals).replace(/\.00$/, "");
  return `${text} ${unit}`;
}

export function roundQty(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function roundBs(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
