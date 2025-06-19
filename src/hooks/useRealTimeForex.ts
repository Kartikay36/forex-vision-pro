
import { useState, useEffect, useRef, useCallback } from 'react';

interface RealTimeForexData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  timestamp: number;
}

interface CandlestickData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Multiple API endpoints for redundancy
const API_ENDPOINTS = {
  fcsapi: 'https://fcsapi.com/api-v3/forex/latest',
  exchangerate: 'https://api.exchangerate-api.com/v4/latest/',
  fixer: 'https://api.fixer.io/latest',
  currencylayer: 'http://api.currencylayer.com/live'
};

// WebSocket URLs for real-time data
const WS_ENDPOINTS = [
  'wss://ws.finnhub.io',
  'wss://stream.tradingeconomics.com'
];

export const useRealTimeForex = (pair: string, timeframe: string) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeForexData | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const priceHistoryRef = useRef<number[]>([]);

  // Base prices for different currency pairs
  const getBasePrice = useCallback((pair: string): number => {
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
    };
    return basePrices[pair] || 1.0000;
  }, []);

  // Generate realistic live data with proper volatility
  const generateLiveData = useCallback((basePrice: number): RealTimeForexData => {
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
      timestamp: now
    };
  }, [pair]);

  // Fetch from multiple APIs with fallback
  const fetchFromAPIs = useCallback(async (): Promise<RealTimeForexData | null> => {
    const [fromCurrency, toCurrency] = pair.split('/');
    
    // Try FCS API first (free tier available)
    try {
      const response = await fetch(`https://fcsapi.com/api-v3/forex/latest?symbol=${fromCurrency}${toCurrency}&access_key=demo`);
      if (response.ok) {
        const data = await response.json();
        if (data.status && data.response && data.response.length > 0) {
          const rate = data.response[0];
          return {
            symbol: pair,
            price: parseFloat(rate.price),
            change: parseFloat(rate.change) || 0,
            changePercent: parseFloat(rate.change_percent) || 0,
            bid: parseFloat(rate.price) - 0.0001,
            ask: parseFloat(rate.price) + 0.0001,
            high: parseFloat(rate.high) || parseFloat(rate.price),
            low: parseFloat(rate.low) || parseFloat(rate.price),
            timestamp: Date.now()
          };
        }
      }
    } catch (error) {
      console.log('FCS API failed, trying next...');
    }

    // Try Exchange Rate API
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      if (response.ok) {
        const data = await response.json();
        if (data.rates && data.rates[toCurrency]) {
          const rate = data.rates[toCurrency];
          return {
            symbol: pair,
            price: rate,
            change: 0, // This API doesn't provide change data
            changePercent: 0,
            bid: rate - 0.0001,
            ask: rate + 0.0001,
            high: rate,
            low: rate,
            timestamp: Date.now()
          };
        }
      }
    } catch (error) {
      console.log('Exchange Rate API failed, using simulation...');
    }

    return null;
  }, [pair]);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Try Finnhub WebSocket
      wsRef.current = new WebSocket(`wss://ws.finnhub.io?token=d19daj9r01qmm7tufo8gd19daj9r01qmm7tufo90`);
      
      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        // Subscribe to forex pair
        const symbol = `OANDA:${pair.replace('/', '_')}`;
        wsRef.current?.send(JSON.stringify({'type':'subscribe', 'symbol': symbol}));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'trade' && data.data) {
            const tradeData = data.data[0];
            if (tradeData) {
              const newData: RealTimeForexData = {
                symbol: pair,
                price: tradeData.p,
                change: 0, // Will be calculated
                changePercent: 0,
                bid: tradeData.p - 0.0001,
                ask: tradeData.p + 0.0001,
                high: tradeData.p,
                low: tradeData.p,
                timestamp: tradeData.t
              };
              setRealTimeData(newData);
            }
          }
        } catch (err) {
          console.log('WebSocket message parsing error:', err);
        }
      };

      wsRef.current.onerror = () => {
        setConnectionStatus('disconnected');
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

    } catch (error) {
      setConnectionStatus('disconnected');
      console.log('WebSocket connection failed:', error);
    }
  }, [pair]);

  // Generate historical data
  const generateHistoricalData = useCallback((basePrice: number, count: number = 50): CandlestickData[] => {
    const data: CandlestickData[] = [];
    let currentPrice = basePrice;
    const volatility = pair.includes('JPY') ? 0.3 : 0.0015;
    
    for (let i = count; i > 0; i--) {
      const timeMs = getTimeframeMs(timeframe);
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
  }, [pair, timeframe]);

  const getTimeframeMs = (tf: string) => {
    const intervals: { [key: string]: number } = {
      '1M': 60000,
      '5M': 300000,
      '15M': 900000,
      '1H': 3600000,
      '4H': 14400000,
      '1D': 86400000
    };
    return intervals[tf] || 3600000;
  };

  // Main data fetching logic
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const basePrice = getBasePrice(pair);
      
      // Try to get real API data first
      const apiData = await fetchFromAPIs();
      
      if (apiData) {
        setRealTimeData(apiData);
      } else {
        // Fall back to simulated live data
        const simulatedData = generateLiveData(basePrice);
        setRealTimeData(simulatedData);
        setError('Using simulated data - APIs unavailable');
      }
      
    } catch (err) {
      console.error('Data fetch error:', err);
      // Always provide data, even if simulated
      const basePrice = getBasePrice(pair);
      const simulatedData = generateLiveData(basePrice);
      setRealTimeData(simulatedData);
      setError('Using simulated data due to API errors');
    }
  }, [pair, getBasePrice, fetchFromAPIs, generateLiveData]);

  // Initialize everything
  useEffect(() => {
    setIsLoading(true);
    
    // Generate initial historical data
    const basePrice = getBasePrice(pair);
    const historical = generateHistoricalData(basePrice);
    setHistoricalData(historical);
    
    // Get initial real-time data
    fetchData().finally(() => {
      setIsLoading(false);
    });
    
    // Set up WebSocket connection
    connectWebSocket();
    
    // Set up periodic updates (every 2 seconds for live feel)
    intervalRef.current = setInterval(fetchData, 2000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [pair, timeframe, fetchData, connectWebSocket, getBasePrice, generateHistoricalData]);

  return {
    realTimeData,
    forexData: historicalData,
    isLoading,
    error,
    connectionStatus
  };
};
