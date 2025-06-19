
export interface RealTimeForexData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: number;
  high24h: number;
  low24h: number;
  timestamp: number;
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

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
