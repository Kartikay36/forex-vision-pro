import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Fullscreen, TrendingUp, TrendingDown, Clock, AlertCircle, Sun, Moon, Activity, Brain } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import LiveChart from './LiveChart';
import PredictionChart from './PredictionChart';
import SignalPanel from './SignalPanel';
import MarketStatus from './MarketStatus';
import CurrencyPairSelector from './CurrencyPairSelector';
import TimeframeSelector from './TimeframeSelector';
import TechnicalIndicators from './TechnicalIndicators';
import { useForexData } from '@/hooks/useForexData';
import { useMarketHours } from '@/hooks/useMarketHours';

const TradingDashboard = () => {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTab, setCurrentTab] = useState('live');
  const { theme, toggleTheme } = useTheme();

  const { forexData, isLoading, lastUpdate } = useForexData(selectedPair, selectedTimeframe);
  const { isMarketOpen, nextMarketEvent, marketSessions } = useMarketHours();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">Forex Trading Pro</h1>
              <Badge variant={isMarketOpen ? "default" : "secondary"} className="text-xs">
                {isMarketOpen ? "Market Open" : "Market Closed"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <MarketStatus 
                isOpen={isMarketOpen} 
                nextEvent={nextMarketEvent}
                sessions={marketSessions}
              />
              
              {/* Theme Toggle */}
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
                <Moon className="h-4 w-4" />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Fullscreen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Controls */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Real-Time Chart</span>
                    <Badge variant="outline" className="text-xs">Candlestick</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <LiveChart
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    isLoading={false}
                    isMarketOpen={isMarketOpen}
                    height={400}
                  />
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>AI Predictions</span>
                    <Badge variant="secondary" className="text-xs">ML Enhanced</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <PredictionChart
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    isLoading={false}
                    height={400}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h Change</div>
                  <div className="text-lg font-semibold text-green-500 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +0.34%
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h High</div>
                  <div className="text-lg font-semibold text-foreground">1.0892</div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h Low</div>
                  <div className="text-lg font-semibold text-foreground">1.0845</div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Volatility</div>
                  <div className="text-lg font-semibold text-yellow-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Medium
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar - Controls & Analysis */}
          <div className="lg:col-span-1 space-y-4">
            <TimeframeSelector
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />

            <TechnicalIndicators
              data={forexData}
              pair={selectedPair}
              timeframe={selectedTimeframe}
            />

            <SignalPanel
              pair={selectedPair}
              timeframe={selectedTimeframe}
              data={forexData}
              isMarketOpen={isMarketOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
