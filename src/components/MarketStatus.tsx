
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Globe } from 'lucide-react';

interface MarketStatusProps {
  isOpen: boolean;
  nextEvent: string;
  sessions: any[];
}

const MarketStatus: React.FC<MarketStatusProps> = ({ isOpen, nextEvent, sessions }) => {
  const getCurrentTimes = () => {
    const now = new Date();
    
    // Indian Standard Time (IST)
    const istTime = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    // UTC Time
    const utcTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    return { istTime, utcTime };
  };

  const { istTime, utcTime } = getCurrentTimes();

  return (
    <div className="flex items-center space-x-3 text-sm">
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <div className="flex space-x-2">
          <Badge variant={isOpen ? "default" : "secondary"} className="text-xs">
            {isOpen ? "OPEN" : "CLOSED"}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="text-xs">{nextEvent}</span>
      </div>

      {/* Time Display */}
      <div className="hidden lg:flex items-center space-x-3 text-xs text-muted-foreground">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">IST</span>
          <span className="font-mono">{istTime}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">UTC</span>
          <span className="font-mono">{utcTime}</span>
        </div>
      </div>
      
      {/* Trading Sessions */}
      <div className="hidden md:flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-muted-foreground">London</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-muted-foreground">NY</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-muted-foreground">Tokyo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStatus;
