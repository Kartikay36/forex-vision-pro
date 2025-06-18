import { useState, useEffect, useCallback } from 'react';

export interface TradingViewData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const useTradingViewData = (pair: string, timeframe: string) => {
  const [currentData, setCurrentData] = useState<TradingViewData | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate real TradingView data with more realistic values
  const generateRealisticData = useCallback((symbol: string) => {
    const basePrices: { [key: string]: number } = {
      'EUR/USD': 1.1503,
      'GBP/USD': 1.2734,
      'USD/JPY': 150.25,
      'AUD/USD': 0.6523,
      'USD/CAD': 1.3675,
      'USD/CHF': 0.8923,
      'NZD/USD': 0.5987,
      'EUR/GBP': 0.8523
    };

    const basePrice = basePrices[symbol] || 1.1503;
    const volatility = symbol.includes('JPY') ? 0.3 : 0.0002;
    
    // Generate more realistic price movement
    const currentPrice = basePrice + (Math.random() - 0.5) * volatility * 2;
    const dailyChange = (Math.random() - 0.5) * 0.015; // Max 1.5% daily change
    const changePercent = dailyChange * 100;
    
    return {
      symbol,
      price: currentPrice,
      change: currentPrice * dailyChange,
      changePercent,
      volume: Math.floor(Math.random() * 5000000) + 1000000,
      high24h: currentPrice * (1 + Math.random() * 0.008),
      low24h: currentPrice * (1 - Math.random() * 0.008),
      timestamp: Date.now()
    };
  }, []);

  // Generate historical candlestick data
  const generateHistoricalData = useCallback((symbol: string, timeframe: string) => {
    const data: CandlestickData[] = [];
    const basePrices: { [key: string]: number } = {
      'EUR/USD': 1.1503,
      'GBP/USD': 1.2734,
      'USD/JPY': 150.25,
      'AUD/USD': 0.6523,
      'USD/CAD': 1.3675,
      'USD/CHF': 0.8923,
      'NZD/USD': 0.5987,
      'EUR/GBP': 0.8523
    };

    const basePrice = basePrices[symbol] || 1.1503;
    const volatility = symbol.includes('JPY') ? 0.1 : 0.0001;
    
    let currentPrice = basePrice;
    const periods = 100; // Last 100 periods
    
    for (let i = periods; i >= 0; i--) {
      const timeMultiplier = timeframe === '1M' ? 60000 : 
                           timeframe === '5M' ? 300000 :
                           timeframe === '15M' ? 900000 :
                           timeframe === '1H' ? 3600000 :
                           timeframe === '4H' ? 14400000 : 86400000;
      
      const timestamp = new Date(Date.now() - i * timeMultiplier);
      
      // Generate realistic OHLC data
      const open = currentPrice;
      const changeRange = volatility * (0.5 + Math.random());
      const high = open + changeRange * Math.random();
      const low = open - changeRange * Math.random();
      const close = low + (high - low) * Math.random();
      
      data.push({
        time: timestamp.toLocaleTimeString(),
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 2000000) + 500000
      });
      
      currentPrice = close + (Math.random() - 0.5) * volatility * 0.1;
    }
    
    return data;
  }, []);

  // Handle data update from TradingView widget
  const handleDataUpdate = useCallback((newData: CandlestickData) => {
    setHistoricalData(prev => {
      const updated = [...prev];
      updated.push(newData);
      // Keep only last 100 candles
      return updated.slice(-100);
    });
    
    setCurrentData({
      symbol: pair,
      price: newData.close,
      change: newData.close - newData.open,
      changePercent: ((newData.close - newData.open) / newData.open) * 100,
      volume: newData.volume,
      high24h: newData.high,
      low24h: newData.low,
      timestamp: Date.now()
    });
    
    setLastUpdate(new Date());
  }, [pair]);

  useEffect(() => {
    setIsLoading(true);
    
    // Initialize with realistic data
    const initialData = generateRealisticData(pair);
    setCurrentData(initialData);
    
    const historical = generateHistoricalData(pair, timeframe);
    setHistoricalData(historical);
    
    setIsLoading(false);
    
    // Update data every 5 seconds to simulate real-time updates
    const interval = setInterval(() => {
      const newData = generateRealisticData(pair);
      setCurrentData(newData);
      setLastUpdate(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [pair, timeframe, generateRealisticData, generateHistoricalData]);

  return {
    currentData,
    historicalData,
    isLoading,
    lastUpdate,
    handleDataUpdate
  };
};
