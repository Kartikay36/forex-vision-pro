
import { RealTimeForexData, CandlestickData } from '@/types/forex';
import { BASE_PRICES, TIMEFRAME_MS } from '@/constants/forexConstants';

export const getBasePrice = (pair: string): number => {
  return BASE_PRICES[pair] || 1.0000;
};

export const generateLiveData = (
  pair: string,
  basePrice: number,
  priceHistoryRef: React.MutableRefObject<number[]>,
  dailyHighRef: React.MutableRefObject<number>,
  dailyLowRef: React.MutableRefObject<number>
): RealTimeForexData => {
  const now = Date.now();
  const volatility = pair.includes('JPY') ? 0.3 : 0.0015;
  
  // Create realistic price movement with trend
  const trendFactor = Math.sin(now / 100000) * 0.5;
  const randomFactor = (Math.random() - 0.5) * 2;
  const priceChange = (trendFactor + randomFactor) * volatility;
  
  const currentPrice = basePrice + priceChange;
  const spread = pair.includes('JPY') ? 0.02 : 0.00002;
  
  // Store price history for change calculation
  priceHistoryRef.current.push(currentPrice);
  if (priceHistoryRef.current.length > 100) {
    priceHistoryRef.current.shift();
  }
  
  // Update daily high/low
  if (currentPrice > dailyHighRef.current) {
    dailyHighRef.current = currentPrice;
  }
  if (currentPrice < dailyLowRef.current) {
    dailyLowRef.current = currentPrice;
  }
  
  const previousPrice = priceHistoryRef.current[priceHistoryRef.current.length - 2] || basePrice;
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;
  
  return {
    symbol: pair,
    price: currentPrice,
    change,
    changePercent,
    bid: currentPrice - spread / 2,
    ask: currentPrice + spread / 2,
    high: Math.max(...priceHistoryRef.current.slice(-20)) || currentPrice,
    low: Math.min(...priceHistoryRef.current.slice(-20)) || currentPrice,
    volume: Math.floor(Math.random() * 1000000) + 500000,
    high24h: dailyHighRef.current || currentPrice,
    low24h: dailyLowRef.current === Infinity ? currentPrice : dailyLowRef.current,
    timestamp: now
  };
};

export const generateHistoricalData = (
  pair: string,
  timeframe: string,
  basePrice: number,
  count: number = 50
): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice;
  const volatility = pair.includes('JPY') ? 0.3 : 0.0015;
  
  for (let i = count; i > 0; i--) {
    const timeMs = TIMEFRAME_MS[timeframe] || 3600000;
    const time = new Date(Date.now() - i * timeMs);
    
    const open = currentPrice;
    const changePercent = (Math.random() - 0.5) * volatility * 2;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    
    data.push({
      time: time.toLocaleTimeString(),
      timestamp: time.getTime(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000000) + 500000
    });
    
    currentPrice = close;
  }
  
  return data;
};
