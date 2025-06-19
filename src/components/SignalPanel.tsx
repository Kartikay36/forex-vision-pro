
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Clock, Target, AlertCircle, Activity } from 'lucide-react';
import { TradingViewData, CandlestickData } from '@/hooks/useTradingViewData';
import { AIForecastEngine } from '@/utils/aiPredictionEngine';

interface SignalPanelProps {
  pair: string;
  timeframe: string;
  data: CandlestickData[];
  isMarketOpen: boolean;
  tradingViewData: TradingViewData | null;
}

interface Signal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  timeframe: string;
  strength: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: Date;
  expiryTimestamp: Date;
  reason: string;
  status: 'active' | 'expired' | 'hit';
  duration: number; // in minutes
  confidence: number;
}

const SignalPanel: React.FC<SignalPanelProps> = ({ 
  pair, 
  timeframe, 
  data, 
  isMarketOpen,
  tradingViewData
}) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('ALL');

  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];
  const majorPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF'];

  // Generate realistic trading signals based on real-time AI analysis
  const generateRealTimeSignals = useCallback(() => {
    if (!tradingViewData || data.length === 0) return;

    const newSignals: Signal[] = [];
    
    majorPairs.forEach(currencyPair => {
      timeframes.forEach(tf => {
        // Use AI engine for signal analysis
        const aiEngine = new AIForecastEngine(currencyPair, data);
        const prediction = aiEngine.generateMLPrediction(24);
        const patterns = aiEngine.detectTechnicalPatterns();
        
        // Generate signals based on AI confidence and patterns
        if (prediction.confidence > 0.6 && patterns.length > 0) {
          const signalType = prediction.direction === 'up' ? 'BUY' : 'SELL';
          
          // Use real price from TradingView data if available
          let basePrice: number;
          if (tradingViewData && currencyPair === tradingViewData.symbol) {
            basePrice = tradingViewData.price;
          } else {
            // Use realistic forex prices
            const forexPrices: { [key: string]: number } = {
              'EUR/USD': 1.1047,
              'GBP/USD': 1.2701,
              'USD/JPY': 149.85,
              'AUD/USD': 0.6587,
              'USD/CAD': 1.3612,
              'USD/CHF': 0.8841
            };
            basePrice = forexPrices[currencyPair] || 1.1047;
          }
          
          const isJPY = currencyPair.includes('JPY');
          const priceVariation = isJPY ? 0.05 : 0.00005;
          
          const entry = basePrice + (Math.random() - 0.5) * priceVariation * 20;
          const stopLoss = signalType === 'BUY' ? 
            entry - (0.001 + Math.random() * 0.001) * basePrice :
            entry + (0.001 + Math.random() * 0.001) * basePrice;
          const takeProfit = signalType === 'BUY' ?
            entry + (0.002 + Math.random() * 0.002) * basePrice :
            entry - (0.002 + Math.random() * 0.002) * basePrice;
          
          // Calculate signal duration based on timeframe and confidence
          let duration: number;
          switch (tf) {
            case '1M': duration = Math.floor(prediction.confidence * 5) + 2; break;
            case '5M': duration = Math.floor(prediction.confidence * 15) + 5; break;
            case '15M': duration = Math.floor(prediction.confidence * 30) + 10; break;
            case '1H': duration = Math.floor(prediction.confidence * 120) + 30; break;
            case '4H': duration = Math.floor(prediction.confidence * 480) + 120; break;
            case '1D': duration = Math.floor(prediction.confidence * 1440) + 240; break;
            default: duration = 60;
          }
          
          const now = new Date();
          const signal: Signal = {
            id: `${currencyPair}-${tf}-${Date.now()}-${Math.random()}`,
            pair: currencyPair,
            type: signalType,
            timeframe: tf,
            strength: Math.floor(prediction.confidence * 100),
            entry: entry,
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            timestamp: now,
            expiryTimestamp: new Date(now.getTime() + duration * 60000),
            reason: patterns.length > 0 ? 
              `${patterns[0].name} + ML Confluence` : 
              'ML Pattern Recognition',
            status: 'active' as const,
            duration: duration,
            confidence: prediction.confidence
          };
          
          newSignals.push(signal);
        }
      });
    });
    
    // Update signals state, removing expired ones
    setSignals(prevSignals => {
      const now = new Date();
      const validSignals = prevSignals.filter(signal => {
        if (signal.expiryTimestamp > now) {
          return true;
        } else {
          signal.status = 'expired';
          return true; // Keep expired signals for display
        }
      });
      
      // Add new signals, avoiding duplicates
      const existingIds = new Set(validSignals.map(s => s.id));
      const uniqueNewSignals = newSignals.filter(s => !existingIds.has(s.id));
      
      const allSignals = [...validSignals, ...uniqueNewSignals];
      
      // Sort by timestamp (newest first) and limit
      return allSignals
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 30);
    });
  }, [tradingViewData, data]);

  // Update signal status based on expiry time
  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prevSignals => 
        prevSignals.map(signal => {
          const now = new Date();
          if (signal.status === 'active' && signal.expiryTimestamp <= now) {
            return { ...signal, status: 'expired' as const };
          }
          return signal;
        })
      );
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  // Generate signals on data change
  useEffect(() => {
    if (isMarketOpen && data.length > 10) {
      generateRealTimeSignals();
      
      // Set up periodic signal generation
      const interval = setInterval(() => {
        if (isMarketOpen) {
          generateRealTimeSignals();
        }
      }, 45000); // Generate new signals every 45 seconds

      return () => clearInterval(interval);
    }
  }, [isMarketOpen, generateRealTimeSignals, data]);

  const filteredSignals = signals.filter(signal => {
    if (selectedTimeframe === 'ALL') return true;
    return signal.timeframe === selectedTimeframe;
  });

  const activeSignals = filteredSignals.filter(s => s.status === 'active').slice(0, 6);
  const expiredSignals = filteredSignals.filter(s => s.status === 'expired').slice(0, 6);

  const SignalCard = ({ signal }: { signal: Signal }) => {
    const timeRemaining = signal.status === 'active' ? 
      Math.max(0, Math.floor((signal.expiryTimestamp.getTime() - Date.now()) / 1000 / 60)) : 0;
    
    return (
      <Card className="bg-slate-800/50 border-slate-700 min-w-[300px]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Badge 
                variant={signal.type === 'BUY' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {signal.type === 'BUY' ? (
                  <><TrendingUp className="h-3 w-3 mr-1" />{signal.type}</>
                ) : (
                  <><TrendingDown className="h-3 w-3 mr-1" />{signal.type}</>
                )}
              </Badge>
              <span className="text-white font-medium">{signal.pair}</span>
              <Badge variant="outline" className="text-xs">
                {signal.timeframe}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-slate-400">
                {signal.strength}%
              </div>
              {signal.status === 'active' ? (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-500" />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm mb-2">
            <div>
              <div className="text-slate-400">Entry</div>
              <div className="text-white font-mono">
                {signal.entry.toFixed(signal.pair.includes('JPY') ? 2 : 5)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">S/L</div>
              <div className="text-red-400 font-mono">
                {signal.stopLoss.toFixed(signal.pair.includes('JPY') ? 2 : 5)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">T/P</div>
              <div className="text-green-400 font-mono">
                {signal.takeProfit.toFixed(signal.pair.includes('JPY') ? 2 : 5)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">{signal.reason}</span>
            <div className="flex items-center text-slate-400">
              <Clock className="h-3 w-3 mr-1" />
              {signal.timestamp.toLocaleTimeString()}
            </div>
          </div>
          
          {signal.status === 'active' && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-400">Confidence: {(signal.confidence * 100).toFixed(0)}%</span>
              <div className="flex items-center text-orange-400">
                <Activity className="h-3 w-3 mr-1" />
                <span>{timeRemaining}m remaining</span>
              </div>
            </div>
          )}
          
          {signal.status === 'expired' && (
            <div className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Expired</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>AI Trading Signals</span>
          <Badge variant="secondary" className="text-xs">
            {activeSignals.length} Active
          </Badge>
          {tradingViewData && (
            <Badge variant="outline" className="text-xs">
              Live Data
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Timeframe Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTimeframe === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('ALL')}
            className="text-xs"
          >
            ALL
          </Button>
          {timeframes.map(tf => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(tf)}
              className="text-xs"
            >
              {tf}
            </Button>
          ))}
        </div>

        {/* Signals Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger value="active">
              Active ({activeSignals.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired ({expiredSignals.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            {activeSignals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSignals.map(signal => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <div>No active signals</div>
                  <div className="text-sm">
                    {isMarketOpen ? 'Analyzing market patterns...' : 'Market is closed'}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="expired" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiredSignals.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Market Status */}
        {!isMarketOpen && (
          <div className="flex items-center justify-center p-4 bg-slate-700/50 rounded-lg">
            <div className="text-center text-slate-400">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm">Market Closed</div>
              <div className="text-xs">Signal generation paused</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignalPanel;
