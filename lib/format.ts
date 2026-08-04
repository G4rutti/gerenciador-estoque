export function fmtMoney(n: number): string {
  const v = Number(n) || 0;
  return "R$ " + v.toFixed(2).replace(".", ",");
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
