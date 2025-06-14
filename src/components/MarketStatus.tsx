
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Globe } from 'lucide-react';

interface MarketStatusProps {
  isOpen: boolean;
  nextEvent: string;
  sessions: any[];
}

const MarketStatus: React.FC<MarketStatusProps> = ({ isOpen, nextEvent, sessions }) => {
  return (
    <div className="flex items-center space-x-3 text-sm">
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-slate-400" />
        <div className="flex space-x-2">
          <Badge variant={isOpen ? "default" : "secondary"} className="text-xs">
            {isOpen ? "OPEN" : "CLOSED"}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 text-slate-400">
        <Clock className="h-4 w-4" />
        <span className="text-xs">{nextEvent}</span>
      </div>
      
      {/* Trading Sessions */}
      <div className="hidden md:flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-400">London</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-slate-400">NY</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-400">Tokyo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStatus;
