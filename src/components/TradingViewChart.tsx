
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TradingViewChartProps {
  pair: string;
  timeframe: string;
  isMarketOpen: boolean;
  height: number;
  onDataUpdate?: (data: any) => void;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  pair, 
  timeframe, 
  isMarketOpen, 
  height,
  onDataUpdate 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Convert our pair format to TradingView format
  const getTradingViewSymbol = (pair: string) => {
    const symbols: { [key: string]: string } = {
      'EUR/USD': 'FX:EURUSD',
      'GBP/USD': 'FX:GBPUSD',
      'USD/JPY': 'FX:USDJPY',
      'AUD/USD': 'FX:AUDUSD',
      'USD/CAD': 'FX:USDCAD',
      'USD/CHF': 'FX:USDCHF',
      'NZD/USD': 'FX:NZDUSD',
      'EUR/GBP': 'FX:EURGBP'
    };
    return symbols[pair] || 'FX:EURUSD';
  };

  // Convert timeframe to TradingView format
  const getTradingViewInterval = (timeframe: string) => {
    const intervals: { [key: string]: string } = {
      '1M': '1',
      '5M': '5',
      '15M': '15',
      '1H': '60',
      '4H': '240',
      '1D': 'D'
    };
    return intervals[timeframe] || '60';
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const config = {
      autosize: true,
      symbol: getTradingViewSymbol(pair),
      interval: getTradingViewInterval(timeframe),
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1", // Candlestick
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      container_id: "tradingview_widget",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: [
        "RSI@tv-basicstudies",
        "MACD@tv-basicstudies",
        "BB@tv-basicstudies"
      ],
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650"
    };

    script.innerHTML = JSON.stringify(config);

    // Create container div for the widget
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'tradingview_widget';
    widgetContainer.style.height = `${height - 60}px`;
    widgetContainer.style.width = '100%';

    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(script);

    // Simulate data extraction (in real implementation, you'd use TradingView's API)
    const simulateDataExtraction = () => {
      const basePrice = pair === 'EUR/USD' ? 1.1503 : 
                       pair === 'GBP/USD' ? 1.2734 :
                       pair === 'USD/JPY' ? 150.25 : 1.0850;
      
      const price = basePrice + (Math.random() - 0.5) * 0.001;
      const change = (Math.random() - 0.5) * 0.002;
      
      setCurrentPrice(price);
      setPriceChange(change);
      setTrend(change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');

      // Simulate candlestick data
      const candlestickData = {
        time: new Date().toISOString(),
        open: price - 0.0001,
        high: price + 0.0002,
        low: price - 0.0002,
        close: price,
        volume: Math.floor(Math.random() * 1000000) + 500000
      };

      if (onDataUpdate) {
        onDataUpdate(candlestickData);
      }
    };

    // Update data every 5 seconds
    const interval = setInterval(simulateDataExtraction, 5000);
    simulateDataExtraction(); // Initial call

    return () => {
      clearInterval(interval);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [pair, timeframe, height]);

  const formatPrice = (price: number) => {
    return pair.includes('JPY') ? price.toFixed(3) : price.toFixed(5);
  };

  return (
    <div className="relative">
      {/* Real-time Price Header */}
      <div className="absolute top-4 left-4 z-10 bg-background/90 rounded-lg p-3 backdrop-blur-sm border border-border">
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-xl font-bold text-foreground">
              {formatPrice(currentPrice)}
            </div>
            <div className={`flex items-center text-sm ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : 
               trend === 'down' ? <TrendingDown className="h-4 w-4 mr-1" /> : null}
              {priceChange > 0 ? '+' : ''}{formatPrice(priceChange)}
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <Badge 
              variant={isMarketOpen ? "default" : "secondary"}
              className="text-xs"
            >
              {isMarketOpen ? "LIVE" : "CLOSED"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              TradingView
            </Badge>
          </div>
        </div>
      </div>

      {/* TradingView Widget Container */}
      <div 
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="bg-slate-900 rounded-lg overflow-hidden"
      />

      {/* Market Status Overlay */}
      {!isMarketOpen && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="text-center">
            <div className="text-foreground text-lg font-semibold mb-2">Market Closed</div>
            <div className="text-muted-foreground">Chart will resume when market opens</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
