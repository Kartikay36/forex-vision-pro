
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

  // Simulate real-time price updates
  useEffect(() => {
    if (!isMarketOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const updatePrice = () => {
      if (data && data.length > 0) {
        const lastPrice = data[data.length - 1]?.price || 1.0850;
        const randomChange = (Math.random() - 0.5) * 0.001;
        const newPrice = lastPrice + randomChange;
        
        setCurrentPrice(newPrice);
        setPriceChange(newPrice - lastPrice);
        setTrend(randomChange > 0 ? 'up' : randomChange < 0 ? 'down' : 'neutral');
      }
    };

    // Update every 1 second for real-time feeling
    intervalRef.current = setInterval(updatePrice, 1000);
    updatePrice(); // Initial update

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data, isMarketOpen]);

  // Generate realistic chart data
  const chartData = React.useMemo(() => {
    const basePrice = 1.0850;
    const points = 100;
    const generatedData = [];
    
    for (let i = 0; i < points; i++) {
      const time = new Date(Date.now() - (points - i) * 60000);
      const volatility = 0.002;
      const randomWalk = (Math.random() - 0.5) * volatility;
      const price = basePrice + (Math.sin(i / 10) * 0.01) + randomWalk;
      
      generatedData.push({
        time: time.toLocaleTimeString(),
        price: price,
        timestamp: time.getTime(),
        volume: Math.random() * 1000000 + 500000,
        high: price + Math.random() * 0.001,
        low: price - Math.random() * 0.001,
        open: price - (Math.random() - 0.5) * 0.0005,
        close: price
      });
    }
    
    // Add current real-time price if available
    if (currentPrice > 0) {
      generatedData.push({
        time: new Date().toLocaleTimeString(),
        price: currentPrice,
        timestamp: Date.now(),
        volume: Math.random() * 1000000 + 500000,
        high: currentPrice + 0.0002,
        low: currentPrice - 0.0002,
        open: currentPrice - 0.0001,
        close: currentPrice
      });
    }
    
    return generatedData;
  }, [currentPrice]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-blue-400">
            Price: {payload[0].value.toFixed(5)}
          </p>
          <p className="text-slate-300 text-sm">
            Volume: {data.volume?.toLocaleString()}
          </p>
          <p className="text-slate-300 text-sm">
            High: {data.high?.toFixed(5)} | Low: {data.low?.toFixed(5)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-lg">
        <div className="flex items-center space-x-2 text-slate-400">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Loading live data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Real-time Price Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-2xl font-bold text-white">
              {currentPrice > 0 ? currentPrice.toFixed(5) : '1.08500'}
            </div>
            <div className={`flex items-center text-sm ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 'text-slate-400'
            }`}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : 
               trend === 'down' ? <TrendingDown className="h-4 w-4 mr-1" /> : null}
              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(5)}
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
      <div style={{ height: `${height}px` }} className="bg-slate-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 60, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={['dataMin - 0.001', 'dataMax + 0.001']}
              tickFormatter={(value) => value.toFixed(5)}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Support and Resistance Lines */}
            <ReferenceLine y={1.0870} stroke="#EF4444" strokeDasharray="5 5" />
            <ReferenceLine y={1.0830} stroke="#10B981" strokeDasharray="5 5" />
            
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3B82F6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Market Status Overlay */}
      {!isMarketOpen && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="text-white text-lg font-semibold mb-2">Market Closed</div>
            <div className="text-slate-400">Chart will resume when market opens</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChart;
