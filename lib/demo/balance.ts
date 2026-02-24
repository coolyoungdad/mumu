const DEMO_BALANCE_KEY = "mumu_demo_balance";
const INITIAL_DEMO_BALANCE = 500;

export function getDemoBalance(): number {
  if (typeof window === "undefined") return INITIAL_DEMO_BALANCE;
  const stored = localStorage.getItem(DEMO_BALANCE_KEY);
  if (stored === null) {
    localStorage.setItem(DEMO_BALANCE_KEY, String(INITIAL_DEMO_BALANCE));
    return INITIAL_DEMO_BALANCE;
  }
  return parseFloat(stored);
}

export function setDemoBalance(amount: number): number {
  const rounded = Math.round(amount * 100) / 100;
  localStorage.setItem(DEMO_BALANCE_KEY, String(rounded));
  return rounded;
}

export function deductDemoBalance(cost: number): number | null {
  const current = getDemoBalance();
  if (current < cost) return null;
  return setDemoBalance(current - cost);
}

export function addDemoBalance(amount: number): number {
  return setDemoBalance(getDemoBalance() + amount);
}

export function resetDemoBalance(): number {
  return setDemoBalance(INITIAL_DEMO_BALANCE);
}
