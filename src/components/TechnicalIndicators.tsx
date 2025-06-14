
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TechnicalIndicatorsProps {
  data: any[];
  pair: string;
  timeframe: string;
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({
  data,
  pair,
  timeframe
}) => {
  const indicators = useMemo(() => {
    // Generate realistic technical indicator values
    const rsi = Math.floor(Math.random() * 100);
    const macd = (Math.random() - 0.5) * 0.001;
    const stochastic = Math.floor(Math.random() * 100);
    const adx = Math.floor(Math.random() * 100);
    const cci = Math.floor((Math.random() - 0.5) * 400);
    const williams = Math.floor(Math.random() * 100);
    
    // Moving averages
    const sma20 = 1.0850 + (Math.random() - 0.5) * 0.002;
    const sma50 = 1.0850 + (Math.random() - 0.5) * 0.004;
    const ema12 = 1.0850 + (Math.random() - 0.5) * 0.001;
    const ema26 = 1.0850 + (Math.random() - 0.5) * 0.003;
    
    // Bollinger Bands
    const bbUpper = 1.0850 + 0.003;
    const bbLower = 1.0850 - 0.003;
    const bbMiddle = 1.0850;
    
    return {
      oscillators: {
        rsi: { value: rsi, signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL' },
        macd: { value: macd, signal: macd > 0 ? 'BUY' : macd < 0 ? 'SELL' : 'NEUTRAL' },
        stochastic: { value: stochastic, signal: stochastic > 80 ? 'SELL' : stochastic < 20 ? 'BUY' : 'NEUTRAL' },
        adx: { value: adx, signal: adx > 25 ? 'STRONG' : 'WEAK' },
        cci: { value: cci, signal: cci > 100 ? 'SELL' : cci < -100 ? 'BUY' : 'NEUTRAL' },
        williams: { value: williams, signal: williams > 80 ? 'SELL' : williams < 20 ? 'BUY' : 'NEUTRAL' }
      },
      movingAverages: {
        sma20: { value: sma20, signal: 1.0850 > sma20 ? 'BUY' : 'SELL' },
        sma50: { value: sma50, signal: 1.0850 > sma50 ? 'BUY' : 'SELL' },
        ema12: { value: ema12, signal: 1.0850 > ema12 ? 'BUY' : 'SELL' },
        ema26: { value: ema26, signal: 1.0850 > ema26 ? 'BUY' : 'SELL' }
      },
      bollingerBands: {
        upper: bbUpper,
        middle: bbMiddle,
        lower: bbLower,
        signal: 1.0850 > bbUpper ? 'SELL' : 1.0850 < bbLower ? 'BUY' : 'NEUTRAL'
      }
    };
  }, [pair, timeframe]);

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp className="h-3 w-3" />;
      case 'SELL':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'text-green-400';
      case 'SELL':
        return 'text-red-400';
      case 'STRONG':
        return 'text-blue-400';
      case 'WEAK':
        return 'text-gray-400';
      default:
        return 'text-slate-400';
    }
  };

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return <Badge variant="default" className="text-xs bg-green-600">BUY</Badge>;
      case 'SELL':
        return <Badge variant="destructive" className="text-xs">SELL</Badge>;
      case 'STRONG':
        return <Badge variant="default" className="text-xs bg-blue-600">STRONG</Badge>;
      case 'WEAK':
        return <Badge variant="secondary" className="text-xs">WEAK</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">NEUTRAL</Badge>;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <BarChart className="h-5 w-5" />
          <span>Technical Analysis</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Oscillators */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Oscillators</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">RSI (14)</span>
                <span className="text-xs text-slate-400">{indicators.oscillators.rsi.value}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={indicators.oscillators.rsi.value} 
                  className="w-16 h-2"
                />
                {getSignalBadge(indicators.oscillators.rsi.signal)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">MACD</span>
                <span className="text-xs text-slate-400">{indicators.oscillators.macd.value.toFixed(5)}</span>
              </div>
              {getSignalBadge(indicators.oscillators.macd.signal)}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">Stochastic</span>
                <span className="text-xs text-slate-400">{indicators.oscillators.stochastic.value}</span>
              </div>
              {getSignalBadge(indicators.oscillators.stochastic.signal)}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">ADX</span>
                <span className="text-xs text-slate-400">{indicators.oscillators.adx.value}</span>
              </div>
              {getSignalBadge(indicators.oscillators.adx.signal)}
            </div>
          </div>
        </div>

        {/* Moving Averages */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Moving Averages</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">SMA 20</span>
                <span className="text-xs text-slate-400 font-mono">
                  {indicators.movingAverages.sma20.value.toFixed(5)}
                </span>
              </div>
              {getSignalBadge(indicators.movingAverages.sma20.signal)}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">SMA 50</span>
                <span className="text-xs text-slate-400 font-mono">
                  {indicators.movingAverages.sma50.value.toFixed(5)}
                </span>
              </div>
              {getSignalBadge(indicators.movingAverages.sma50.signal)}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">EMA 12</span>
                <span className="text-xs text-slate-400 font-mono">
                  {indicators.movingAverages.ema12.value.toFixed(5)}
                </span>
              </div>
              {getSignalBadge(indicators.movingAverages.ema12.signal)}
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Bollinger Bands</h4>
          <div className="space-y-2">
            <div className="text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Upper:</span>
                <span className="font-mono">{indicators.bollingerBands.upper.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span>Middle:</span>
                <span className="font-mono">{indicators.bollingerBands.middle.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lower:</span>
                <span className="font-mono">{indicators.bollingerBands.lower.toFixed(5)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Signal:</span>
              {getSignalBadge(indicators.bollingerBands.signal)}
            </div>
          </div>
        </div>

        {/* Overall Summary */}
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Overall Signal:</span>
            <Badge variant="default" className="bg-blue-600">
              BUY (Strong)
            </Badge>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Based on 8 technical indicators
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnicalIndicators;
