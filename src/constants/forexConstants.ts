
// Multiple API endpoints for redundancy
export const API_ENDPOINTS = {
  fcsapi: 'https://fcsapi.com/api-v3/forex/latest',
  exchangerate: 'https://api.exchangerate-api.com/v4/latest/',
  fixer: 'https://api.fixer.io/latest',
  currencylayer: 'http://api.currencylayer.com/live'
};

// WebSocket URLs for real-time data
export const WS_ENDPOINTS = [
  'wss://ws.finnhub.io',
  'wss://stream.tradingeconomics.com'
];

// Base prices for different currency pairs
export const BASE_PRICES: { [key: string]: number } = {
  'EUR/USD': 1.0890,
  'GBP/USD': 1.2750,
  'USD/JPY': 148.50,
  'AUD/USD': 0.6580,
  'USD/CAD': 1.3850,
  'USD/CHF': 0.8950,
  'NZD/USD': 0.5950,
  'EUR/GBP': 0.8530,
  'EUR/JPY': 161.80,
  'GBP/JPY': 189.40,
};

export const TIMEFRAME_MS: { [key: string]: number } = {
  '1M': 60000,
  '5M': 300000,
  '15M': 900000,
  '1H': 3600000,
  '4H': 14400000,
  '1D': 86400000
};
