// Balance update event for cross-component communication
export const BALANCE_UPDATE_EVENT = 'pompom:balance:update';

export interface BalanceUpdateDetail {
  newBalance: number;
  source: 'box_open' | 'sellback' | 'topup' | 'shipping' | 'initial_load' | 'withdrawal';
}

// Dispatch balance update event
export function dispatchBalanceUpdate(newBalance: number, source: BalanceUpdateDetail['source']) {
  const event = new CustomEvent<BalanceUpdateDetail>(BALANCE_UPDATE_EVENT, {
    detail: { newBalance, source },
  });
  window.dispatchEvent(event);
}

// Type-safe event listener
export function onBalanceUpdate(callback: (detail: BalanceUpdateDetail) => void) {
  const handler = (event: Event) => {
    callback((event as CustomEvent<BalanceUpdateDetail>).detail);
  };
  window.addEventListener(BALANCE_UPDATE_EVENT, handler);
  return () => window.removeEventListener(BALANCE_UPDATE_EVENT, handler);
}
