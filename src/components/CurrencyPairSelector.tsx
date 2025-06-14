
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface CurrencyPairSelectorProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
  forexData: any[];
}

const CurrencyPairSelector: React.FC<CurrencyPairSelectorProps> = ({
  selectedPair,
  onPairChange,
  forexData
}) => {
  const majorPairs = [
    { 
      pair: 'EUR/USD', 
      price: 1.0850, 
      change: 0.34, 
      volume: '2.1B',
      spread: 0.8,
      volatility: 'Medium'
    },
    { 
      pair: 'GBP/USD', 
      price: 1.2734, 
      change: -0.12, 
      volume: '1.8B',
      spread: 1.2,
      volatility: 'High'
    },
    { 
      pair: 'USD/JPY', 
      price: 150.25, 
      change: 0.67, 
      volume: '1.5B',
      spread: 0.9,
      volatility: 'Medium'
    },
    { 
      pair: 'AUD/USD', 
      price: 0.6523, 
      change: -0.28, 
      volume: '900M',
      spread: 1.1,
      volatility: 'High'
    },
    { 
      pair: 'USD/CAD', 
      price: 1.3675, 
      change: 0.15, 
      volume: '750M',
      spread: 1.3,
      volatility: 'Low'
    },
    { 
      pair: 'USD/CHF', 
      price: 0.8923, 
      change: -0.09, 
      volume: '680M',
      spread: 1.0,
      volatility: 'Low'
    },
    { 
      pair: 'NZD/USD', 
      price: 0.5987, 
      change: -0.45, 
      volume: '450M',
      spread: 1.5,
      volatility: 'High'
    },
    { 
      pair: 'EUR/GBP', 
      price: 0.8523, 
      change: 0.22, 
      volume: '620M',
      spread: 1.4,
      volatility: 'Medium'
    }
  ];

  // Get real-time prices if available from forexData
  const getRealTimePrice = (pair: string) => {
    const pairData = majorPairs.find(p => p.pair === pair);
    if (forexData && forexData.length > 0) {
      const latestData = forexData[forexData.length - 1];
      return latestData?.price || pairData?.price || 0;
    }
    return pairData?.price || 0;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Currency Pairs</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {majorPairs.map((pairData) => (
          <Button
            key={pairData.pair}
            variant={selectedPair === pairData.pair ? "default" : "ghost"}
            className={`w-full justify-start p-3 h-auto ${
              selectedPair === pairData.pair 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={() => onPairChange(pairData.pair)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <div className="font-semibold">
                  {pairData.pair}
                </div>
                <div className="text-xs text-muted-foreground">
                  Vol: {pairData.volume}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="font-mono">
                  {pairData.pair.includes('JPY') 
                    ? getRealTimePrice(pairData.pair).toFixed(2) 
                    : getRealTimePrice(pairData.pair).toFixed(5)
                  }
                </div>
                <div className={`flex items-center text-xs ${
                  pairData.change > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {pairData.change > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {pairData.change > 0 ? '+' : ''}{pairData.change}%
                </div>
              </div>
            </div>
          </Button>
        ))}
        
        {/* Market Overview */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground mb-2">Market Overview</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Most Active:</span>
              <span className="text-foreground">EUR/USD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Highest Volatility:</span>
              <span className="text-foreground">GBP/USD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tightest Spread:</span>
              <span className="text-foreground">EUR/USD (0.8 pips)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencyPairSelector;
