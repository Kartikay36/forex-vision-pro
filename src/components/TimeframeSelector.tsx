
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface TimeframeSelectorProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selectedTimeframe,
  onTimeframeChange
}) => {
  const timeframes = [
    { value: '1M', label: '1 Min', description: 'Scalping' },
    { value: '5M', label: '5 Min', description: 'Short-term' },
    { value: '15M', label: '15 Min', description: 'Quick trades' },
    { value: '1H', label: '1 Hour', description: 'Intraday' },
    { value: '4H', label: '4 Hour', description: 'Swing' },
    { value: '1D', label: '1 Day', description: 'Position' },
    { value: '1W', label: '1 Week', description: 'Long-term' },
    { value: '1M', label: '1 Month', description: 'Investment' }
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Timeframe</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={selectedTimeframe === tf.value ? "default" : "outline"}
              size="sm"
              className={`flex flex-col items-center p-3 h-auto ${
                selectedTimeframe === tf.value 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-slate-600 hover:bg-slate-700"
              }`}
              onClick={() => onTimeframeChange(tf.value)}
            >
              <div className="font-semibold text-white">
                {tf.label}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {tf.description}
              </div>
            </Button>
          ))}
        </div>
        
        {/* Timeframe Info */}
        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">Selected Timeframe</div>
          <div className="text-white font-medium">
            {timeframes.find(tf => tf.value === selectedTimeframe)?.label || selectedTimeframe}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Best for: {timeframes.find(tf => tf.value === selectedTimeframe)?.description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeframeSelector;
