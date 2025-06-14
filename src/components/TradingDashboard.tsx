
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Fullscreen, TrendingUp, TrendingDown, Clock, AlertCircle, Sun, Moon } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
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
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Sidebar - Currency Pairs */}
          <div className="xl:col-span-1">
            <CurrencyPairSelector 
              selectedPair={selectedPair}
              onPairChange={setSelectedPair}
              forexData={forexData}
            />
          </div>

          {/* Main Content - Charts */}
          <div className="xl:col-span-3">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center space-x-2">
                    <span>{selectedPair}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedTimeframe}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Last update: {lastUpdate}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted">
                    <TabsTrigger 
                      value="live" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Live Chart
                    </TabsTrigger>
                    <TabsTrigger 
                      value="prediction"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      AI Prediction
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="live" className="mt-0">
                    <div className="relative">
                      <LiveChart
                        data={forexData}
                        pair={selectedPair}
                        timeframe={selectedTimeframe}
                        isLoading={isLoading}
                        isMarketOpen={isMarketOpen}
                        height={isFullscreen ? 600 : 400}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="prediction" className="mt-0">
                    <div className="relative">
                      <PredictionChart
                        data={forexData}
                        pair={selectedPair}
                        timeframe={selectedTimeframe}
                        isLoading={isLoading}
                        height={isFullscreen ? 600 : 400}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

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
          <div className="xl:col-span-1 space-y-4">
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
