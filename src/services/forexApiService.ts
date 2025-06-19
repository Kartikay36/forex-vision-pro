
import { RealTimeForexData } from '@/types/forex';
import { API_ENDPOINTS } from '@/constants/forexConstants';

export const fetchFromAPIs = async (
  pair: string,
  dailyHighRef: React.MutableRefObject<number>,
  dailyLowRef: React.MutableRefObject<number>
): Promise<RealTimeForexData | null> => {
  const [fromCurrency, toCurrency] = pair.split('/');
  
  // Try FCS API first (free tier available)
  try {
    const response = await fetch(`https://fcsapi.com/api-v3/forex/latest?symbol=${fromCurrency}${toCurrency}&access_key=demo`);
    if (response.ok) {
      const data = await response.json();
      if (data.status && data.response && data.response.length > 0) {
        const rate = data.response[0];
        const price = parseFloat(rate.price);
        
        // Update daily high/low
        if (price > dailyHighRef.current) {
          dailyHighRef.current = price;
        }
        if (price < dailyLowRef.current) {
          dailyLowRef.current = price;
        }
        
        return {
          symbol: pair,
          price,
          change: parseFloat(rate.change) || 0,
          changePercent: parseFloat(rate.change_percent) || 0,
          bid: price - 0.0001,
          ask: price + 0.0001,
          high: parseFloat(rate.high) || price,
          low: parseFloat(rate.low) || price,
          volume: Math.floor(Math.random() * 1000000) + 500000,
          high24h: dailyHighRef.current || price,
          low24h: dailyLowRef.current === Infinity ? price : dailyLowRef.current,
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
        
        // Update daily high/low
        if (rate > dailyHighRef.current) {
          dailyHighRef.current = rate;
        }
        if (rate < dailyLowRef.current) {
          dailyLowRef.current = rate;
        }
        
        return {
          symbol: pair,
          price: rate,
          change: 0, // This API doesn't provide change data
          changePercent: 0,
          bid: rate - 0.0001,
          ask: rate + 0.0001,
          high: rate,
          low: rate,
          volume: Math.floor(Math.random() * 1000000) + 500000,
          high24h: dailyHighRef.current || rate,
          low24h: dailyLowRef.current === Infinity ? rate : dailyLowRef.current,
          timestamp: Date.now()
        };
      }
    }
  } catch (error) {
    console.log('Exchange Rate API failed, using simulation...');
  }

  return null;
};
