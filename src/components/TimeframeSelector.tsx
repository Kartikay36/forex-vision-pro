
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
    { value: '1MO', label: '1 Month', description: 'Investment' }
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground flex items-center space-x-2">
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
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "border-border hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => onTimeframeChange(tf.value)}
            >
              <div className="font-semibold">
                {tf.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {tf.description}
              </div>
            </Button>
          ))}
        </div>
        
        {/* Timeframe Info */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Selected Timeframe</div>
          <div className="text-foreground font-medium">
            {timeframes.find(tf => tf.value === selectedTimeframe)?.label || selectedTimeframe}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Best for: {timeframes.find(tf => tf.value === selectedTimeframe)?.description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeframeSelector;
