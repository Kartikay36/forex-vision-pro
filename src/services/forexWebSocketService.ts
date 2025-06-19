
import { RealTimeForexData, ConnectionStatus } from '@/types/forex';

export const createWebSocketConnection = (
  pair: string,
  onMessage: (data: RealTimeForexData) => void,
  onStatusChange: (status: ConnectionStatus) => void,
  dailyHighRef: React.MutableRefObject<number>,
  dailyLowRef: React.MutableRefObject<number>
): WebSocket | null => {
  try {
    // Try Finnhub WebSocket
    const ws = new WebSocket(`wss://ws.finnhub.io?token=d19daj9r01qmm7tufo8gd19daj9r01qmm7tufo90`);
    
    ws.onopen = () => {
      onStatusChange('connected');
      // Subscribe to forex pair
      const symbol = `OANDA:${pair.replace('/', '_')}`;
      ws.send(JSON.stringify({'type':'subscribe', 'symbol': symbol}));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'trade' && data.data) {
          const tradeData = data.data[0];
          if (tradeData) {
            // Update daily high/low for WebSocket data
            if (tradeData.p > dailyHighRef.current) {
              dailyHighRef.current = tradeData.p;
            }
            if (tradeData.p < dailyLowRef.current) {
              dailyLowRef.current = tradeData.p;
            }

            const newData: RealTimeForexData = {
              symbol: pair,
              price: tradeData.p,
              change: 0, // Will be calculated
              changePercent: 0,
              bid: tradeData.p - 0.0001,
              ask: tradeData.p + 0.0001,
              high: tradeData.p,
              low: tradeData.p,
              volume: Math.floor(Math.random() * 1000000) + 500000,
              high24h: dailyHighRef.current || tradeData.p,
              low24h: dailyLowRef.current === Infinity ? tradeData.p : dailyLowRef.current,
              timestamp: tradeData.t
            };
            onMessage(newData);
          }
        }
      } catch (err) {
        console.log('WebSocket message parsing error:', err);
      }
    };

    ws.onerror = () => {
      onStatusChange('disconnected');
    };

    ws.onclose = () => {
      onStatusChange('disconnected');
    };

    return ws;
  } catch (error) {
    onStatusChange('disconnected');
    console.log('WebSocket connection failed:', error);
    return null;
  }
};
