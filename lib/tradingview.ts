export type TradingViewExchange = 'NASDAQ' | 'NYSE' | 'AMEX' | 'OTC';

export function mapFinnhubExchangeToTradingView(exchange?: string): TradingViewExchange | undefined {
  const raw = (exchange || '').toUpperCase();
  if (!raw) return undefined;

  if (raw.includes('NASDAQ')) return 'NASDAQ';
  if (raw.includes('NEW YORK STOCK EXCHANGE') || raw.includes('NYSE')) return 'NYSE';
  if (raw.includes('NYSE AMERICAN') || raw.includes('AMEX') || raw.includes('AMERICAN STOCK EXCHANGE')) return 'AMEX';
  if (raw.includes('OTC')) return 'OTC';

  return undefined;
}

export function buildTradingViewSymbol(symbol: string, exchange?: TradingViewExchange): string | undefined {
  const clean = (symbol || '').trim().toUpperCase();
  if (!clean) return undefined;
  if (clean.includes(':')) return clean;
  if (!exchange) return undefined;
  return `${exchange}:${clean}`;
}
