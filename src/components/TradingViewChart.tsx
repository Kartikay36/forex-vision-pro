import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useForexData } from '@/hooks/useForexData';

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

  const { realTimeData, forexData, isLoading, error } = useForexData(pair, timeframe);

  // Convert our pair format to TradingView Forex.com format
  const getTradingViewSymbol = (pair: string) => {
    const symbols: { [key: string]: string } = {
      'EUR/USD': 'FX_IDC:EURUSD',
      'GBP/USD': 'FX_IDC:GBPUSD', 
      'USD/JPY': 'FX_IDC:USDJPY',
      'AUD/USD': 'FX_IDC:AUDUSD',
      'USD/CAD': 'FX_IDC:USDCAD',
      'USD/CHF': 'FX_IDC:USDCHF',
      'NZD/USD': 'FX_IDC:NZDUSD',
      'EUR/GBP': 'FX_IDC:EURGBP',
      'EUR/JPY': 'FX_IDC:EURJPY',
      'GBP/JPY': 'FX_IDC:GBPJPY',
      'AUD/JPY': 'FX_IDC:AUDJPY',
      'EUR/CAD': 'FX_IDC:EURCAD',
      'GBP/CAD': 'FX_IDC:GBPCAD',
    };
    return symbols[pair] || 'ICE:EURUSD';
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

  // Update price and trend when realTimeData changes
  useEffect(() => {
    if (realTimeData) {
      setCurrentPrice(realTimeData.currentPrice);
      setPriceChange(realTimeData.priceChange);
      setTrend(realTimeData.priceChange > 0 ? 'up' : realTimeData.priceChange < 0 ? 'down' : 'neutral');
    }
  }, [realTimeData]);

  // Initialize TradingView widget
  useEffect(() => {
    if (!containerRef.current || isLoading) return;
    
    // Clear existing widget
    containerRef.current.innerHTML = '';

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
      hide_top_toolbar: true, // Hide TradingView header
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

    // Update parent with latest data
    if (onDataUpdate && forexData.length > 0) {
      const latestData = forexData[forexData.length - 1];
      onDataUpdate({
        ...latestData,
        currentPrice: realTimeData?.currentPrice || latestData.close,
        priceChange: realTimeData?.priceChange || 0
      });
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [pair, timeframe, height, forexData, isLoading]);

  const formatPrice = (price: number) => {
    // JPY pairs need 3 decimals, others need 5
    return pair.includes('JPY') ? price.toFixed(3) : price.toFixed(5);
  };

  const formatChange = (change: number) => {
    // Format change with proper decimal places
    return (change > 0 ? '+' : '') + formatPrice(change);
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
              {formatChange(priceChange)}
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

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
            <div className="text-foreground text-lg font-semibold">Loading market data...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="text-center">
            <div className="text-destructive text-lg font-semibold mb-2">Data Error</div>
            <div className="text-muted-foreground">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
