
import React, { useEffect, useRef, useState } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useRealForexData } from '@/hooks/useRealForexData';

interface LiveChartProps {
  pair: string;
  timeframe: string;
  isLoading: boolean;
  isMarketOpen: boolean;
  height: number;
}

const LiveChart: React.FC<LiveChartProps> = ({ 
  pair, 
  timeframe, 
  isMarketOpen, 
  height 
}) => {
  const { forexData, isLoading } = useRealForexData(pair, timeframe);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Update current price from latest data
  useEffect(() => {
    if (forexData.length > 0) {
      const latest = forexData[forexData.length - 1];
      const previous = forexData[forexData.length - 2];
      
      setCurrentPrice(latest.close);
      
      if (previous) {
        const change = latest.close - previous.close;
        setPriceChange(change);
        setTrend(change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');
      }
    }
  }, [forexData]);

  // Custom Candlestick Component for Bar chart
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#10B981' : '#EF4444';
    
    // Calculate positions
    const maxPrice = Math.max(high, open, close, low);
    const minPrice = Math.min(high, open, close, low);
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;
    
    const scale = height / priceRange;
    
    // Wick positions
    const highY = y + (maxPrice - high) * scale;
    const lowY = y + (maxPrice - low) * scale;
    
    // Body positions
    const openY = y + (maxPrice - open) * scale;
    const closeY = y + (maxPrice - close) * scale;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(openY - closeY);
    
    const candleX = x + width / 2;
    const bodyWidth = Math.max(width * 0.6, 2);
    
    return (
      <g>
        {/* High-Low Wick */}
        <line
          x1={candleX}
          y1={highY}
          x2={candleX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Candle Body */}
        <rect
          x={candleX - bodyWidth / 2}
          y={bodyTop}
          width={bodyWidth}
          height={Math.max(bodyHeight, 1)}
          fill={isGreen ? color : 'none'}
          stroke={color}
          strokeWidth={isGreen ? 0 : 1}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formatPrice = (price: number) => {
        return pair.includes('JPY') ? price.toFixed(3) : price.toFixed(5);
      };
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          <div className="space-y-1 text-sm">
            <p>Open: {formatPrice(data.open)}</p>
            <p>High: {formatPrice(data.high)}</p>
            <p>Low: {formatPrice(data.low)}</p>
            <p>Close: {formatPrice(data.close)}</p>
            <p className="text-muted-foreground">Volume: {data.volume?.toLocaleString()}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatPrice = (price: number) => {
    return pair.includes('JPY') ? price.toFixed(3) : price.toFixed(5);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Loading real-time data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Real-time Price Header */}
      <div className="absolute top-4 left-4 z-10 bg-background/90 rounded-lg p-3 backdrop-blur-sm border border-border">
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-2xl font-bold text-foreground">
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
              {timeframe}
            </Badge>
          </div>
        </div>
      </div>

      {/* Candlestick Chart */}
      <div style={{ height: `${height}px` }} className="bg-muted/20 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forexData} margin={{ top: 60, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={['dataMin - 0.001', 'dataMax + 0.001']}
              tickFormatter={(value) => formatPrice(value)}
            />
            <YAxis 
              yAxisId="volume"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Volume bars */}
            <Bar
              dataKey="volume"
              fill="hsl(var(--muted))"
              opacity={0.3}
              yAxisId="volume"
            />
            
            {/* Support and Resistance Lines */}
            <ReferenceLine 
              y={currentPrice * 1.002} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="5 5" 
              label="Resistance"
            />
            <ReferenceLine 
              y={currentPrice * 0.998} 
              stroke="hsl(var(--chart-2))" 
              strokeDasharray="5 5" 
              label="Support"
            />
            
            {/* Custom Candlesticks */}
            <Bar
              dataKey="high"
              shape={<CandlestickBar />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

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

export default LiveChart;
