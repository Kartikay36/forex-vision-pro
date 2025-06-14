
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fullscreen, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Forex Trading Pro</h1>
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
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white border-slate-600 hover:bg-slate-700"
              >
                <Fullscreen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-4">
            <CurrencyPairSelector 
              selectedPair={selectedPair}
              onPairChange={setSelectedPair}
              forexData={forexData}
            />
            
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

          {/* Main Content - Charts */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <span>{selectedPair}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedTimeframe}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span>Last update: {lastUpdate}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                    <TabsTrigger 
                      value="live" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Live Chart
                    </TabsTrigger>
                    <TabsTrigger 
                      value="prediction"
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
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
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">24h Change</div>
                  <div className="text-lg font-semibold text-green-500 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +0.34%
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">24h High</div>
                  <div className="text-lg font-semibold text-white">1.0892</div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">24h Low</div>
                  <div className="text-lg font-semibold text-white">1.0845</div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-sm text-slate-400">Volatility</div>
                  <div className="text-lg font-semibold text-yellow-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Medium
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
