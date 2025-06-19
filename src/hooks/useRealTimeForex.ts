
import { useState, useEffect, useRef, useCallback } from 'react';
import { RealTimeForexData, CandlestickData, ConnectionStatus } from '@/types/forex';
import { getBasePrice, generateLiveData, generateHistoricalData } from '@/utils/forexDataGenerator';
import { fetchFromAPIs } from '@/services/forexApiService';
import { createWebSocketConnection } from '@/services/forexWebSocketService';

export const useRealTimeForex = (pair: string, timeframe: string) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeForexData | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const priceHistoryRef = useRef<number[]>([]);
  const dailyHighRef = useRef<number>(0);
  const dailyLowRef = useRef<number>(Infinity);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = createWebSocketConnection(
      pair,
      (data) => setRealTimeData(data),
      (status) => setConnectionStatus(status),
      dailyHighRef,
      dailyLowRef
    );

    if (ws) {
      wsRef.current = ws;
      
      // Set up reconnection logic
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
    }
  }, [pair]);

  // Main data fetching logic
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const basePrice = getBasePrice(pair);
      
      // Try to get real API data first
      const apiData = await fetchFromAPIs(pair, dailyHighRef, dailyLowRef);
      
      if (apiData) {
        setRealTimeData(apiData);
      } else {
        // Fall back to simulated live data
        const simulatedData = generateLiveData(pair, basePrice, priceHistoryRef, dailyHighRef, dailyLowRef);
        setRealTimeData(simulatedData);
        setError('Using simulated data - APIs unavailable');
      }
      
    } catch (err) {
      console.error('Data fetch error:', err);
      // Always provide data, even if simulated
      const basePrice = getBasePrice(pair);
      const simulatedData = generateLiveData(pair, basePrice, priceHistoryRef, dailyHighRef, dailyLowRef);
      setRealTimeData(simulatedData);
      setError('Using simulated data due to API errors');
    }
  }, [pair]);

  // Initialize everything
  useEffect(() => {
    setIsLoading(true);
    
    // Generate initial historical data
    const basePrice = getBasePrice(pair);
    const historical = generateHistoricalData(pair, timeframe, basePrice);
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
  }, [pair, timeframe, fetchData, connectWebSocket]);

  return {
    realTimeData,
    forexData: historicalData,
    isLoading,
    error,
    connectionStatus
  };
};
