
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
  const basePrice = pair.includes('JPY') ? 150.25 : 1.0850;
  const points = getPointsForTimeframe(timeframe);
  const data = [];
  
  for (let i = 0; i < points; i++) {
    const time = new Date(Date.now() - (points - i) * getIntervalMs(timeframe));
    const volatility = pair.includes('GBP') ? 0.003 : 0.002;
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
