
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
  aiPrediction?: number;
  bullishScenario?: number;
  bearishScenario?: number;
  confidenceBand?: number;
  supportLevel?: number;
  resistanceLevel?: number;
  type?: 'historical' | 'prediction';
}

// Global state for consistent data across all components
const globalDataState: { 
  [key: string]: {
    currentData: TradingViewData;
    historicalData: CandlestickData[];
    lastUpdate: number;
  }
} = {};

// Use Alpha Vantage API for real-time forex data
const ALPHA_VANTAGE_API_KEY = 'SY7OKDT6MC3SP3WI';

export const useTradingViewData = (pair: string, timeframe: string) => {
  const [currentData, setCurrentData] = useState<TradingViewData | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const prevPriceRef = useRef<number | null>(null);
  const lastApiCallRef = useRef<number>(0);
  const rateLimitRef = useRef<boolean>(false);

  // Get base price for currency pair
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

  // Generate realistic data based on current market conditions
  const generateRealisticData = useCallback((basePrice: number): TradingViewData => {
    const now = Date.now();
    const volatility = pair.includes('JPY') ? 0.5 : 0.0008;
    const priceChange = (Math.random() - 0.5) * volatility * 2;
    const currentPrice = basePrice + priceChange;
    const changePercent = (priceChange / basePrice) * 100;
    
    return {
      symbol: pair,
      price: currentPrice,
      change: priceChange,
      changePercent,
      volume: Math.floor(Math.random() * 1000000) + 500000,
      high24h: currentPrice * (1 + Math.random() * 0.01),
      low24h: currentPrice * (1 - Math.random() * 0.01),
      timestamp: now,
      bid: currentPrice - (pair.includes('JPY') ? 0.01 : 0.00001),
      ask: currentPrice + (pair.includes('JPY') ? 0.01 : 0.00001)
    };
  }, [pair]);

  // Fetch real-time data from Alpha Vantage with rate limiting
  const fetchRealTimeData = useCallback(async () => {
    const now = Date.now();
    
    // Check rate limiting (only try API every 30 seconds if we hit the limit)
    if (rateLimitRef.current && (now - lastApiCallRef.current) < 30000) {
      // Use simulated data during rate limit
      const basePrice = getBasePrice(pair);
      const simulatedData = generateRealisticData(basePrice);
      setCurrentData(simulatedData);
      setLastUpdate(new Date());
      setError(null);
      return;
    }

    try {
      const [fromCurrency, toCurrency] = pair.split('/');
      lastApiCallRef.current = now;
      
      const response = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      
      // Check for rate limit message
      if (data['Information'] && data['Information'].includes('rate limit')) {
        rateLimitRef.current = true;
        console.log('Alpha Vantage rate limit reached, using simulated data');
        
        const basePrice = getBasePrice(pair);
        const simulatedData = generateRealisticData(basePrice);
        setCurrentData(simulatedData);
        setLastUpdate(new Date());
        setError('Using simulated data - API rate limit reached');
        return;
      }
      
      if (!data['Realtime Currency Exchange Rate']) {
        throw new Error('Invalid API response');
      }
      
      const rateData = data['Realtime Currency Exchange Rate'];
      const currentPrice = parseFloat(rateData['5. Exchange Rate']);
      const bidPrice = parseFloat(rateData['8. Bid Price']);
      const askPrice = parseFloat(rateData['9. Ask Price']);
      
      // Calculate price change
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
        volume: Math.floor(Math.random() * 1000000) + 500000,
        high24h: Math.max(currentData?.high24h || 0, currentPrice),
        low24h: Math.min(currentData?.low24h || Infinity, currentPrice),
        timestamp: Date.now(),
        bid: bidPrice,
        ask: askPrice
      };
      
      // Update global state for consistency
      if (!globalDataState[pair]) {
        globalDataState[pair] = {
          currentData: newData,
          historicalData: [],
          lastUpdate: Date.now()
        };
      } else {
        globalDataState[pair].currentData = newData;
        globalDataState[pair].lastUpdate = Date.now();
      }
      
      setCurrentData(newData);
      setLastUpdate(new Date());
      prevPriceRef.current = currentPrice;
      setError(null);
      rateLimitRef.current = false; // Reset rate limit flag on successful call
      
    } catch (err) {
      console.error('Real-time data fetch error:', err);
      
      // Fallback to simulated data
      const basePrice = getBasePrice(pair);
      const simulatedData = generateRealisticData(basePrice);
      setCurrentData(simulatedData);
      setLastUpdate(new Date());
      setError('Using simulated data - API error');
    }
  }, [pair, currentData, generateRealisticData]);

  // Generate realistic historical data
  const generateRealisticHistoricalData = useCallback((basePrice: number, count: number): CandlestickData[] => {
    const data: CandlestickData[] = [];
    let currentPrice = basePrice;
    
    for (let i = count; i > 0; i--) {
      const time = new Date(Date.now() - i * getTimeframeMs(timeframe));
      const volatility = pair.includes('JPY') ? 0.3 : 0.0015;
      
      const open = currentPrice;
      const change = (Math.random() - 0.5) * volatility * 2;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      data.push({
        time: time.toLocaleTimeString(),
        timestamp: time.getTime(),
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 600000) + 400000,
        type: 'historical' as const
      });
      
      currentPrice = close;
    }
    
    return data;
  }, [pair, timeframe]);

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

  // Handle data update from external sources
  const handleDataUpdate = useCallback((newData: CandlestickData) => {
    setHistoricalData(prev => {
      const updated = [...prev, { ...newData, timestamp: Date.now() }];
      return updated.slice(-100); // Keep last 100 points
    });
    
    // Update current data based on latest candlestick
    if (currentData) {
      const change = newData.close - currentData.price;
      const changePercent = (change / currentData.price) * 100;
      
      const updatedCurrentData: TradingViewData = {
        ...currentData,
        price: newData.close,
        change,
        changePercent,
        volume: newData.volume,
        high24h: Math.max(currentData.high24h, newData.high),
        low24h: Math.min(currentData.low24h, newData.low),
        timestamp: Date.now()
      };
      
      setCurrentData(updatedCurrentData);
      if (globalDataState[pair]) {
        globalDataState[pair].currentData = updatedCurrentData;
      }
    }
  }, [currentData, pair]);

  // Initialize data fetching
  useEffect(() => {
    setIsLoading(true);
    
    // Check if we have recent data in global state
    const globalData = globalDataState[pair];
    const isRecentData = globalData && (Date.now() - globalData.lastUpdate) < 30000;
    
    if (isRecentData) {
      setCurrentData(globalData.currentData);
      setHistoricalData(globalData.historicalData);
      setIsLoading(false);
    } else {
      // Generate initial historical data
      const basePrice = getBasePrice(pair);
      const initialHistoricalData = generateRealisticHistoricalData(basePrice, 50);
      setHistoricalData(initialHistoricalData);
      
      if (globalDataState[pair]) {
        globalDataState[pair].historicalData = initialHistoricalData;
      }
      
      fetchRealTimeData().finally(() => {
        setIsLoading(false);
      });
    }
    
    // Set up real-time updates every 30 seconds to respect rate limits
    intervalRef.current = setInterval(fetchRealTimeData, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pair, timeframe, fetchRealTimeData, generateRealisticHistoricalData]);

  return {
    currentData,
    historicalData,
    isLoading,
    lastUpdate,
    error,
    handleDataUpdate
  };
};
