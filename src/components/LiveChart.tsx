
import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface LiveChartProps {
  data: any[];
  pair: string;
  timeframe: string;
  isLoading: boolean;
  isMarketOpen: boolean;
  height: number;
}

const LiveChart: React.FC<LiveChartProps> = ({ 
  data, 
  pair, 
  timeframe, 
  isLoading, 
  isMarketOpen, 
  height 
}) => {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const intervalRef = useRef<NodeJS.Timeout>();

  // Get base price for the current pair
  const getBasePrice = (pair: string) => {
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
    return basePrices[pair] || 1.0000;
  };

  // Simulate real-time price updates
  useEffect(() => {
    const basePrice = getBasePrice(pair);
    setCurrentPrice(basePrice);

    if (!isMarketOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPriceChange(0);
      setTrend('neutral');
      return;
    }

    const updatePrice = () => {
      const lastPrice = currentPrice || basePrice;
      
      // Different volatility for different pairs
      let volatility = 0.0005;
      if (pair.includes('GBP') || pair.includes('AUD') || pair.includes('NZD')) {
        volatility = 0.0008;
      }
      if (pair.includes('CHF') || pair.includes('CAD')) {
        volatility = 0.0003;
      }
      if (pair.includes('JPY')) {
        volatility = 0.1;
      }
      
      const randomChange = (Math.random() - 0.5) * volatility;
      const newPrice = lastPrice + randomChange;
      
      setCurrentPrice(newPrice);
      setPriceChange(randomChange);
      setTrend(randomChange > 0 ? 'up' : randomChange < 0 ? 'down' : 'neutral');
    };

    // Update every 1 second for real-time feeling
    intervalRef.current = setInterval(updatePrice, 1000);
    updatePrice(); // Initial update

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pair, isMarketOpen, currentPrice]);

  // Generate realistic chart data
  const chartData = React.useMemo(() => {
    const basePrice = getBasePrice(pair);
    const points = 100;
    const generatedData = [];
    
    // Different volatility for chart data
    let volatility = 0.002;
    if (pair.includes('GBP') || pair.includes('AUD') || pair.includes('NZD')) {
      volatility = 0.003;
    }
    if (pair.includes('CHF') || pair.includes('CAD')) {
      volatility = 0.0015;
    }
    if (pair.includes('JPY')) {
      volatility = 0.5;
    }
    
    for (let i = 0; i < points; i++) {
      const time = new Date(Date.now() - (points - i) * 60000);
      const trend = Math.sin(i / 20) * volatility;
      const noise = (Math.random() - 0.5) * volatility;
      const price = basePrice + trend + noise;
      
      generatedData.push({
        time: time.toLocaleTimeString(),
        price: price,
        timestamp: time.getTime(),
        volume: Math.random() * 1000000 + 500000,
        high: price + Math.random() * volatility * 0.5,
        low: price - Math.random() * volatility * 0.5,
        open: price - (Math.random() - 0.5) * volatility * 0.3,
        close: price
      });
    }
    
    // Add current real-time price if available and market is open
    if (currentPrice > 0 && isMarketOpen) {
      generatedData.push({
        time: new Date().toLocaleTimeString(),
        price: currentPrice,
        timestamp: Date.now(),
        volume: Math.random() * 1000000 + 500000,
        high: currentPrice + volatility * 0.2,
        low: currentPrice - volatility * 0.2,
        open: currentPrice - volatility * 0.1,
        close: currentPrice
      });
    }
    
    return generatedData;
  }, [currentPrice, pair, isMarketOpen]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formatPrice = (price: number) => {
        return pair.includes('JPY') ? price.toFixed(3) : price.toFixed(5);
      };
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          <p className="text-primary">
            Price: {formatPrice(payload[0].value)}
          </p>
          <p className="text-muted-foreground text-sm">
            Volume: {data.volume?.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-sm">
            High: {formatPrice(data.high)} | Low: {formatPrice(data.low)}
          </p>
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
          <span>Loading live data...</span>
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

      {/* Chart */}
      <div style={{ height: `${height}px` }} className="bg-muted/20 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 60, right: 30, left: 20, bottom: 5 }}>
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
            <Tooltip content={<CustomTooltip />} />
            
            {/* Support and Resistance Lines */}
            <ReferenceLine 
              y={getBasePrice(pair) * 1.002} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="5 5" 
            />
            <ReferenceLine 
              y={getBasePrice(pair) * 0.998} 
              stroke="hsl(var(--chart-2))" 
              strokeDasharray="5 5" 
            />
            
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
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
