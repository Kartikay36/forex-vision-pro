
import { useState, useEffect } from 'react';

export const useForexData = (pair: string, timeframe: string) => {
  const [forexData, setForexData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const generateData = () => {
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const data = generateRealisticData(pair, timeframe);
        setForexData(data);
        setLastUpdate(new Date().toLocaleTimeString());
        setIsLoading(false);
      }, 1000);
    };

    generateData();
    
    // Update data every 5 seconds for real-time simulation
    const interval = setInterval(generateData, 5000);
    
    return () => clearInterval(interval);
  }, [pair, timeframe]);

  return { forexData, isLoading, lastUpdate };
};

const generateRealisticData = (pair: string, timeframe: string) => {
  // Different base prices for different currency pairs
  const basePrices: { [key: string]: number } = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2734,
    'USD/JPY': 150.25,
    'AUD/USD': 0.6523,
    'USD/CAD': 1.3675,
    'USD/CHF': 0.8923,
    'NZD/USD': 0.5987,
    'EUR/GBP': 0.8523,
  };

  const basePrice = basePrices[pair] || 1.0000;
  const points = getPointsForTimeframe(timeframe);
  const data = [];
  
  for (let i = 0; i < points; i++) {
    const time = new Date(Date.now() - (points - i) * getIntervalMs(timeframe));
    
    // Different volatility patterns for different pairs
    let volatility = 0.002;
    if (pair.includes('GBP') || pair.includes('AUD') || pair.includes('NZD')) {
      volatility = 0.003; // Higher volatility for these pairs
    }
    if (pair.includes('CHF') || pair.includes('CAD')) {
      volatility = 0.0015; // Lower volatility for these pairs
    }
    if (pair.includes('JPY')) {
      volatility = 0.5; // Different scale for JPY pairs
    }
    
    const trend = Math.sin(i / 20) * volatility;
    const noise = (Math.random() - 0.5) * volatility;
    const price = basePrice + trend + noise;
    
    data.push({
      time: time.toISOString(),
      price: price,
      volume: Math.random() * 1000000 + 500000,
      high: price + Math.random() * volatility * 0.5,
      low: price - Math.random() * volatility * 0.5,
      open: price - (Math.random() - 0.5) * volatility * 0.3,
      close: price
    });
  }
  
  return data;
};

const getPointsForTimeframe = (timeframe: string) => {
  switch (timeframe) {
    case '1M': return 100;
    case '5M': return 200;
    case '15M': return 150;
    case '1H': return 100;
    case '4H': return 50;
    case '1D': return 30;
    default: return 100;
  }
};

const getIntervalMs = (timeframe: string) => {
  switch (timeframe) {
    case '1M': return 60000;
    case '5M': return 300000;
    case '15M': return 900000;
    case '1H': return 3600000;
    case '4H': return 14400000;
    case '1D': return 86400000;
    default: return 3600000;
  }
};
