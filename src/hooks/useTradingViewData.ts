import { useState, useRef, useEffect, useCallback } from 'react';

export interface TradingViewData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  timestamp: number;
  bid?: number;
  ask?: number;
}

export interface CandlestickData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Global price state to ensure synchronization across components
const globalPriceState: { [key: string]: TradingViewData } = {};

// Get your free API key from https://finnhub.io/
const FINNHUB_API_KEY = 'd19daj9r01qmm7tufo8gd19daj9r01qmm7tufo90';

export const useTradingViewData = (pair: string, timeframe: string) => {
  const [currentData, setCurrentData] = useState<TradingViewData | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  // Convert pair to FOREX.com format (EUR/USD -> FOREX:EURUSD)
  const formatPair = useCallback((pair: string) => {
    return `FOREX:${pair.replace('/', '')}`;
  }, []);

  // Convert timeframe to Finnhub resolution
  const getResolution = useCallback((timeframe: string) => {
    switch (timeframe) {
      case '1M': return '1';
      case '5M': return '5';
      case '15M': return '15';
      case '1H': return '60';
      case '4H': return '240';
      case '1D': return 'D';
      default: return 'D';
    }
  }, []);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async (symbol: string, resolution: string) => {
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
  }, [timeframe]);

  // Initialize WebSocket for real-time updates
  const initWebSocket = useCallback((symbol: string) => {
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
            const priceChange = prevPriceRef.current 
              ? currentPrice - prevPriceRef.current
              : 0;
            const priceChangePercent = prevPriceRef.current 
              ? (priceChange / prevPriceRef.current) * 100
              : 0;
            
            const newData: TradingViewData = {
              symbol: pair,
              price: currentPrice,
              change: priceChange,
              changePercent: priceChangePercent,
              volume: trade.v || 0,
              high24h: Math.max(currentData?.high24h || 0, currentPrice),
              low24h: Math.min(currentData?.low24h || Infinity, currentPrice),
              timestamp: Date.now()
            };
            
            // Update global state
            globalPriceState[pair] = newData;
            setCurrentData(newData);
            setLastUpdate(new Date());
            
            prevPriceRef.current = currentPrice;
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
  }, [currentData, pair]);

  // Handle data update from TradingView widget
  const handleDataUpdate = useCallback((newData: CandlestickData) => {
    setHistoricalData(prev => {
      const updated = [...prev];
      updated.push({
        ...newData,
        timestamp: Date.now()
      });
      return updated.slice(-100);
    });
    
    // Update current data to match the candlestick
    const prevClose = prevPriceRef.current || newData.open;
    const change = newData.close - prevClose;
    const changePercent = (change / prevClose) * 100;
    
    const updatedCurrentData: TradingViewData = {
      symbol: pair,
      price: newData.close,
      change,
      changePercent,
      volume: newData.volume,
      high24h: Math.max(currentData?.high24h || 0, newData.high),
      low24h: Math.min(currentData?.low24h || Infinity, newData.low),
      timestamp: Date.now()
    };
    
    globalPriceState[pair] = updatedCurrentData;
    setCurrentData(updatedCurrentData);
    setLastUpdate(new Date());
    prevPriceRef.current = newData.close;
  }, [currentData, pair]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const symbol = formatPair(pair);
        const resolution = getResolution(timeframe);
        
        // Fetch historical data
        const historical = await fetchHistoricalData(symbol, resolution);
        setHistoricalData(historical);
        
        // Initialize with last historical price
        if (historical.length > 0) {
          const last = historical[historical.length - 1];
          prevPriceRef.current = last.close;
          
          const initialData: TradingViewData = {
            symbol: pair,
            price: last.close,
            change: 0,
            changePercent: 0,
            volume: last.volume,
            high24h: Math.max(...historical.map(h => h.high)),
            low24h: Math.min(...historical.map(h => h.low)),
            timestamp: Date.now()
          };
          
          globalPriceState[pair] = initialData;
          setCurrentData(initialData);
        }
        
        // Initialize WebSocket for real-time updates
        initWebSocket(symbol);
        
      } catch (err) {
        setError('Failed to initialize data');
        console.error('Data initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [pair, timeframe, formatPair, getResolution, fetchHistoricalData, initWebSocket]);

  return {
    currentData,
    historicalData,
    isLoading,
    lastUpdate,
    error,
    handleDataUpdate
  };
};
