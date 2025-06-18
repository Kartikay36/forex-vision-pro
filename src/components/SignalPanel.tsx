
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Clock, Target, AlertCircle } from 'lucide-react';

interface SignalPanelProps {
  pair: string;
  timeframe: string;
  data: any[];
  isMarketOpen: boolean;
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
  reason: string;
  status: 'active' | 'expired' | 'hit';
}

const SignalPanel: React.FC<SignalPanelProps> = ({ 
  pair, 
  timeframe, 
  data, 
  isMarketOpen 
}) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('ALL');

  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];
  const majorPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF'];

  // Generate realistic trading signals
  useEffect(() => {
    const generateSignals = () => {
      const newSignals: Signal[] = [];
      
      majorPairs.forEach(currencyPair => {
        timeframes.forEach(tf => {
          // Generate 1-3 signals per pair per timeframe
          const signalCount = Math.floor(Math.random() * 3) + 1;
          
          for (let i = 0; i < signalCount; i++) {
            const issBuy = Math.random() > 0.5;
            const basePrice = currencyPair.includes('JPY') ? 150.25 : 1.0850;
            const priceVariation = currencyPair.includes('JPY') ? 0.1 : 0.0001;
            
            const entry = basePrice + (Math.random() - 0.5) * priceVariation * 100;
            const stopLoss = issBuy ? 
              entry - (Math.random() * 0.002 + 0.001) * basePrice :
              entry + (Math.random() * 0.002 + 0.001) * basePrice;
            const takeProfit = issBuy ?
              entry + (Math.random() * 0.004 + 0.002) * basePrice :
              entry - (Math.random() * 0.004 + 0.002) * basePrice;
            
            const signal: Signal = {
              id: `${currencyPair}-${tf}-${i}-${Date.now()}`,
              pair: currencyPair,
              type: issBuy ? 'BUY' : 'SELL',
              timeframe: tf,
              strength: Math.floor(Math.random() * 40) + 60, // 60-100%
              entry: entry,
              stopLoss: stopLoss,
              takeProfit: takeProfit,
              timestamp: new Date(Date.now() - Math.random() * 3600000), // Within last hour
              reason: [
                'RSI oversold/overbought',
                'MACD crossover',
                'Support/Resistance break',
                'Moving average convergence',
                'Volume spike detected',
                'Bollinger band squeeze'
              ][Math.floor(Math.random() * 6)],
              status: ['active', 'active', 'active', 'expired'][Math.floor(Math.random() * 4)] as 'active' | 'expired'
            };
            
            newSignals.push(signal);
          }
        });
      });
      
      // Sort by timestamp (newest first)
      newSignals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setSignals(newSignals.slice(0, 50)); // Limit to 50 signals
    };

    generateSignals();
    
    // Update signals every 30 seconds if market is open
    const interval = setInterval(() => {
      if (isMarketOpen) {
        generateSignals();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isMarketOpen]);

  const filteredSignals = signals.filter(signal => {
    if (selectedTimeframe === 'ALL') return true;
    return signal.timeframe === selectedTimeframe;
  });

  const activeSignals = filteredSignals.filter(s => s.status === 'active').slice(0, 6);
  const expiredSignals = filteredSignals.filter(s => s.status === 'expired').slice(0, 6);

  const SignalCard = ({ signal }: { signal: Signal }) => (
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
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{signal.reason}</span>
          <div className="flex items-center text-slate-400">
            <Clock className="h-3 w-3 mr-1" />
            {signal.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Trading Signals</span>
          <Badge variant="secondary" className="text-xs">
            {activeSignals.length} Active
          </Badge>
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
              <div className="flex gap-4 overflow-x-auto pb-4">
                {activeSignals.map(signal => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <div>No active signals</div>
                  <div className="text-sm">Waiting for trading opportunities...</div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="expired" className="mt-4">
            <div className="flex gap-4 overflow-x-auto pb-4">
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
              <div className="text-xs">Signals paused until market opens</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignalPanel;
