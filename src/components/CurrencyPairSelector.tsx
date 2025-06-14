
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

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
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
                ? "bg-blue-600 hover:bg-blue-700" 
                : "hover:bg-slate-700"
            }`}
            onClick={() => onPairChange(pairData.pair)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <div className="font-semibold text-white">
                  {pairData.pair}
                </div>
                <div className="text-xs text-slate-300">
                  Vol: {pairData.volume}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="font-mono text-white">
                  {pairData.pair.includes('JPY') 
                    ? pairData.price.toFixed(2) 
                    : pairData.price.toFixed(5)
                  }
                </div>
                <div className={`flex items-center text-xs ${
                  pairData.change > 0 ? 'text-green-400' : 'text-red-400'
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
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">Market Overview</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Most Active:</span>
              <span className="text-white">EUR/USD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Highest Volatility:</span>
              <span className="text-white">GBP/USD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Tightest Spread:</span>
              <span className="text-white">EUR/USD (0.8 pips)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencyPairSelector;
