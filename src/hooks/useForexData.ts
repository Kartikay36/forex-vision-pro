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

// Get your free API key from https://finnhub.io/
const FINNHUB_API_KEY = 'd19daj9r01qmm7tufo8gd19daj9r01qmm7tufo90';

export const useForexData = (pair: string, timeframe: string) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const previousPriceRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Convert pair to FOREX.com format (EUR/USD -> FOREX:EURUSD)
  const formatPair = (pair: string) => {
    return `FOREX:${pair.replace('/', '')}`;
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

  // Fetch real-time quote
  const fetchRealTimeQuote = async (symbol: string) => {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch quote');
      
      const quote = await response.json();
      
      if (quote.c === 0) throw new Error('Invalid quote data');
      
      const currentPrice = quote.c;
      const priceChange = currentPrice - quote.pc; // Current - previous close
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
      // Calculate time range based on timeframe
      const to = Math.floor(Date.now() / 1000);
      let from = to;
      
      switch (timeframe) {
        case '1M':
        case '5M':
        case '15M':
          from = to - 24 * 60 * 60; // 1 day
          break;
        case '1H':
        case '4H':
          from = to - 7 * 24 * 60 * 60; // 1 week
          break;
        case '1D':
          from = to - 30 * 24 * 60 * 60; // 1 month
          break;
        default:
          from = to - 30 * 24 * 60 * 60; // 1 month
      }
      
      const response = await fetch(
        `https://finnhub.io/api/v1/forex/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch historical data');
      
      const data = await response.json();
      
      if (data.s !== 'ok' || !data.t || data.t.length === 0) {
        throw new Error('Invalid historical data');
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

  // Initialize WebSocket for real-time updates
  const initWebSocket = (symbol: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    const socket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);
    socketRef.current = socket;
    
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'subscribe', symbol }));
    });
    
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'trade' && data.data) {
          const trade = data.data[0];
          if (trade && trade.s === symbol) {
            const currentPrice = trade.p;
            const priceChange = previousPriceRef.current 
              ? currentPrice - previousPriceRef.current
              : 0;
            const priceChangePercent = previousPriceRef.current 
              ? (priceChange / previousPriceRef.current) * 100
              : 0;
            
            setRealTimeData({
              currentPrice,
              priceChange,
              priceChangePercent,
              lastRefreshed: Date.now()
            });
            
            previousPriceRef.current = currentPrice;
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setError('Realtime connection error');
    });
    
    return socket;
  };

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const symbol = formatPair(pair);
      const resolution = getResolution(timeframe);
      
      // Fetch initial quote
      const quote = await fetchRealTimeQuote(symbol);
      setRealTimeData(quote);
      previousPriceRef.current = quote.currentPrice;
      
      // Fetch historical data
      const historical = await fetchHistoricalData(symbol, resolution);
      setHistoricalData(historical);
      
      // Initialize WebSocket for real-time updates
      initWebSocket(symbol);
      
    } catch (err) {
      setError('Failed to load forex data');
      console.error('Data initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh historical data periodically
    intervalRef.current = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => {
      // Cleanup
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
