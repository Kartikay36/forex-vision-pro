
import { useState, useEffect, useRef } from 'react';

interface CandlestickData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface RealTimeData {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastRefreshed: number;
}

// Updated Finnhub API key
const FINNHUB_API_KEY = 'd19daj9r01qmm7tufo8gd19daj9r01qmm7tufo90';

export const useForexData = (pair: string, timeframe: string) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const previousPriceRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Convert pair to OANDA format (EUR/USD -> OANDA:EUR_USD)
  const formatPair = (pair: string) => {
    return `OANDA:${pair.replace('/', '_')}`;
  };

  // Convert timeframe to Finnhub resolution
  const getResolution = (timeframe: string) => {
    switch (timeframe) {
      case '1M': return '1';
      case '5M': return '5';
      case '15M': return '15';
      case '1H': return '60';
      case '4H': return '240';
      case '1D': return 'D';
      default: return 'D';
    }
  };

  // Get base price for fallback data
  const getBasePrice = (pair: string): number => {
    const basePrices: { [key: string]: number } = {
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
      'AUD/JPY': 97.75,
      'EUR/CAD': 1.5090,
      'GBP/CAD': 1.7690,
    };
    return basePrices[pair] || 1.0000;
  };

  // Generate realistic fallback data
  const generateFallbackData = (basePrice: number): RealTimeData => {
    const volatility = pair.includes('JPY') ? 0.5 : 0.0008;
    const priceChange = (Math.random() - 0.5) * volatility * 2;
    const currentPrice = basePrice + priceChange;
    const priceChangePercent = (priceChange / basePrice) * 100;
    
    return {
      currentPrice,
      priceChange,
      priceChangePercent,
      lastRefreshed: Date.now()
    };
  };

  // Generate historical fallback data
  const generateHistoricalFallback = (basePrice: number): CandlestickData[] => {
    const data: CandlestickData[] = [];
    let currentPrice = basePrice;
    
    for (let i = 50; i > 0; i--) {
      const time = new Date(Date.now() - i * getTimeframeMs(timeframe));
      const volatility = pair.includes('JPY') ? 0.3 : 0.0015;
      
      const open = currentPrice;
      const change = (Math.random() - 0.5) * volatility * 2;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      data.push({
        time: time.toISOString(),
        timestamp: time.getTime(),
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 600000) + 400000
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  const getTimeframeMs = (tf: string) => {
    switch (tf) {
      case '1M': return 60000;
      case '5M': return 300000;
      case '15M': return 900000;
      case '1H': return 3600000;
      case '4H': return 14400000;
      case '1D': return 86400000;
      default: return 3600000;
    }
  };

  // Fetch real-time quote
  const fetchRealTimeQuote = async (symbol: string) => {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const quote = await response.json();
      
      if (quote.error) {
        throw new Error(quote.error);
      }
      
      if (!quote.c || quote.c === 0) {
        throw new Error('Invalid quote data');
      }
      
      const currentPrice = quote.c;
      const priceChange = currentPrice - quote.pc;
      const priceChangePercent = (priceChange / quote.pc) * 100;
      
      return {
        currentPrice,
        priceChange,
        priceChangePercent,
        lastRefreshed: Date.now()
      };
    } catch (err) {
      console.error('Finnhub quote error:', err);
      throw err;
    }
  };

  // Fetch historical data
  const fetchHistoricalData = async (symbol: string, resolution: string) => {
    try {
      const to = Math.floor(Date.now() / 1000);
      let from = to;
      
      switch (timeframe) {
        case '1M':
        case '5M':
        case '15M':
          from = to - 24 * 60 * 60;
          break;
        case '1H':
        case '4H':
          from = to - 7 * 24 * 60 * 60;
          break;
        case '1D':
          from = to - 30 * 24 * 60 * 60;
          break;
        default:
          from = to - 30 * 24 * 60 * 60;
      }
      
      const response = await fetch(
        `https://finnhub.io/api/v1/forex/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.s !== 'ok' || !data.t || data.t.length === 0) {
        throw new Error('No historical data available');
      }
      
      return data.t.map((timestamp: number, i: number) => ({
        time: new Date(timestamp * 1000).toISOString(),
        timestamp: timestamp * 1000,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v ? data.v[i] : 0
      }));
    } catch (err) {
      console.error('Finnhub historical data error:', err);
      throw err;
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const symbol = formatPair(pair);
      const resolution = getResolution(timeframe);
      const basePrice = getBasePrice(pair);
      
      console.log(`Fetching data for ${symbol} with resolution ${resolution}`);
      
      // Try to fetch real-time quote
      let quote: RealTimeData;
      try {
        quote = await fetchRealTimeQuote(symbol);
        console.log('Successfully fetched real-time quote');
      } catch (quoteError) {
        console.warn('Using fallback data for quote:', quoteError);
        quote = generateFallbackData(basePrice);
        setError('Using simulated data - API unavailable');
      }
      
      setRealTimeData(quote);
      previousPriceRef.current = quote.currentPrice;
      
      // Try to fetch historical data
      let historical: CandlestickData[];
      try {
        historical = await fetchHistoricalData(symbol, resolution);
        console.log('Successfully fetched historical data');
      } catch (historicalError) {
        console.warn('Using fallback data for historical:', historicalError);
        historical = generateHistoricalFallback(basePrice);
      }
      
      setHistoricalData(historical);
      
    } catch (err) {
      console.error('Data initialization error:', err);
      setError('Failed to load forex data');
      
      // Use complete fallback
      const basePrice = getBasePrice(pair);
      const fallbackQuote = generateFallbackData(basePrice);
      const fallbackHistorical = generateHistoricalFallback(basePrice);
      
      setRealTimeData(fallbackQuote);
      setHistoricalData(fallbackHistorical);
      previousPriceRef.current = fallbackQuote.currentPrice;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh data every 2 minutes
    intervalRef.current = setInterval(fetchData, 2 * 60 * 1000);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pair, timeframe]);

  return { 
    realTimeData, 
    forexData: historicalData,
    isLoading, 
    error 
  };
};
