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
  bidPrice: number;
  askPrice: number;
  priceChange: number;
  lastRefreshed: string;
}

// 1. API KEY CONFIGURATION - Replace this with your actual Alpha Vantage API key
const ALPHA_VANTAGE_API_KEY = 'SY7OKDT6MC3SP3WI'; // <-- ENTER YOUR API KEY HERE

export const useRealForexData = (pair: string, timeframe: string) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const previousPriceRef = useRef<number | null>(null);

  // Fetch real-time exchange rate
  const fetchRealTimeData = async () => {
    try {
      const [fromCurrency, toCurrency] = pair.split('/');
      
      // 2. REAL-TIME DATA ENDPOINT
      const response = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      const data = await response.json();
      
      if (!data['Realtime Currency Exchange Rate']) {
        throw new Error('Invalid API response');
      }
      
      const rateData = data['Realtime Currency Exchange Rate'];
      const currentPrice = parseFloat(rateData['5. Exchange Rate']);
      const bidPrice = parseFloat(rateData['8. Bid Price']);
      const askPrice = parseFloat(rateData['9. Ask Price']);
      const lastRefreshed = rateData['6. Last Refreshed'];
      
      // Calculate price change
      const priceChange = previousPriceRef.current 
        ? currentPrice - previousPriceRef.current
        : 0;

      // Update real-time data
      setRealTimeData({
        currentPrice,
        bidPrice,
        askPrice,
        priceChange,
        lastRefreshed
      });

      previousPriceRef.current = currentPrice;
      setIsLoading(false);
      setError(null);

    } catch (err) {
      setError('Failed to fetch real-time data');
      setIsLoading(false);
      console.error('API error:', err);
    }
  };

  // Fetch historical data
  const fetchHistoricalData = async () => {
    try {
      const [fromCurrency, toCurrency] = pair.split('/');
      
      // 3. HISTORICAL DATA ENDPOINT (Optional - needs premium API key for intraday)
      const response = await fetch(
        `https://www.alphavantage.co/query?function=FX_${getAlphaVantageTimeframe(timeframe)}&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`
      );
      
      const data = await response.json();
      
      if (!data[`Time Series FX (${getAlphaVantageTimeframe(timeframe)})`]) {
        throw new Error('Historical data not available');
      }
      
      const timeSeries = data[`Time Series FX (${getAlphaVantageTimeframe(timeframe)})`];
      const formattedData = Object.entries(timeSeries).map(([time, values]: [string, any]) => ({
        time,
        timestamp: new Date(time).getTime(),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: 0 // Alpha Vantage doesn't provide volume for forex
      }));
      
      setHistoricalData(formattedData.reverse());
      
    } catch (err) {
      console.warn('Failed to fetch historical data, using simulated data instead');
      // Fallback to simulated data if historical API fails
      setHistoricalData(generateSimulatedData());
    }
  };

  // Generate simulated data (fallback)
  const generateSimulatedData = (): CandlestickData[] => {
    if (!realTimeData) return [];
    
    const basePrice = realTimeData.currentPrice;
    const points = 100;
    const data: CandlestickData[] = [];
    
    for (let i = 0; i < points; i++) {
      const time = new Date(Date.now() - (points - i) * getIntervalMs(timeframe));
      const volatility = 0.0015 * Math.sqrt(i);
      const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      
      data.push({
        time: time.toISOString(),
        timestamp: time.getTime(),
        open,
        high: Math.max(open, close) * (1 + Math.random() * volatility * 0.5),
        low: Math.min(open, close) * (1 - Math.random() * volatility * 0.5),
        close,
        volume: Math.floor(Math.random() * 800000) + 500000
      });
    }
    
    return data;
  };

  // Convert timeframe to Alpha Vantage format
  const getAlphaVantageTimeframe = (tf: string) => {
    switch (tf) {
      case '1D': return 'DAILY';
      case '1W': return 'WEEKLY';
      case '1M': return 'MONTHLY';
      default: return 'DAILY';
    }
  };

  // Initialize data fetching
  useEffect(() => {
    setIsLoading(true);
    fetchRealTimeData();
    fetchHistoricalData();
    
    // Set up interval for real-time updates (respecting 5 requests/minute limit)
    intervalRef.current = setInterval(fetchRealTimeData, 15000); // 15 seconds
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pair, timeframe]);

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

  return { 
    realTimeData, 
    forexData: historicalData.length > 0 ? historicalData : generateSimulatedData(),
    isLoading, 
    error 
  };
};
