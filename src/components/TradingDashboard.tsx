
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Fullscreen, TrendingUp, TrendingDown, Clock, AlertCircle, Sun, Moon, Activity, Brain, Maximize2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import LiveChart from './LiveChart';
import TradingViewChart from './TradingViewChart';
import PredictionChart from './PredictionChart';
import FullscreenPredictionChart from './FullscreenPredictionChart';
import SignalPanel from './SignalPanel';
import MarketStatus from './MarketStatus';
import CurrencyPairSelector from './CurrencyPairSelector';
import TimeframeSelector from './TimeframeSelector';
import TechnicalIndicators from './TechnicalIndicators';
import { useForexData } from '@/hooks/useForexData';
import { useTradingViewData } from '@/hooks/useTradingViewData';
import { useMarketHours } from '@/hooks/useMarketHours';

const TradingDashboard = () => {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrediction, setShowFullscreenPrediction] = useState(false);
  const [currentTab, setCurrentTab] = useState('live');
  const { theme, toggleTheme } = useTheme();

  const { currentData, historicalData, isLoading, lastUpdate, handleDataUpdate } = useTradingViewData(selectedPair, selectedTimeframe);
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
      {/* Fullscreen Prediction Chart */}
      {showFullscreenPrediction && (
        <FullscreenPredictionChart
          pair={selectedPair}
          timeframe={selectedTimeframe}
          tradingViewData={currentData}
          historicalData={historicalData}
          onClose={() => setShowFullscreenPrediction(false)}
        />
      )}

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">Forex Trading Pro</h1>
              <Badge variant={isMarketOpen ? "default" : "secondary"} className="text-xs">
                {isMarketOpen ? "Market Open" : "Market Closed"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                TradingView Integration
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
            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>TradingView Live Chart</span>
                    <Badge variant="outline" className="text-xs">Real-time</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TradingViewChart
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    isMarketOpen={isMarketOpen}
                    height={400}
                    onDataUpdate={handleDataUpdate}
                  />
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>AI Predictions</span>
                      <Badge variant="secondary" className="text-xs">TradingView Data</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullscreenPrediction(true)}
                      className="text-xs"
                    >
                      <Maximize2 className="h-4 w-4 mr-1" />
                      Fullscreen
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <PredictionChart
                    pair={selectedPair}
                    timeframe={selectedTimeframe}
                    isLoading={isLoading}
                    height={400}
                    tradingViewData={currentData}
                    historicalData={historicalData}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Trading Signals */}
            <SignalPanel
              pair={selectedPair}
              timeframe={selectedTimeframe}
              data={historicalData}
              isMarketOpen={isMarketOpen}
              tradingViewData={currentData}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h Change</div>
                  <div className={`text-lg font-semibold flex items-center ${
                    currentData?.changePercent && currentData.changePercent > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {currentData?.changePercent && currentData.changePercent > 0 ? 
                      <TrendingUp className="h-4 w-4 mr-1" /> : 
                      <TrendingDown className="h-4 w-4 mr-1" />
                    }
                    {currentData?.changePercent?.toFixed(2) || '0.00'}%
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h High</div>
                  <div className="text-lg font-semibold text-foreground">
                    {currentData?.high24h ? 
                      (selectedPair.includes('JPY') ? currentData.high24h.toFixed(3) : currentData.high24h.toFixed(5)) :
                      '--'
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h Low</div>
                  <div className="text-lg font-semibold text-foreground">
                    {currentData?.low24h ? 
                      (selectedPair.includes('JPY') ? currentData.low24h.toFixed(3) : currentData.low24h.toFixed(5)) :
                      '--'
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Volume</div>
                  <div className="text-lg font-semibold text-yellow-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {currentData?.volume ? (currentData.volume / 1000000).toFixed(1) + 'M' : '--'}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar - Controls & Analysis */}
          <div className="lg:col-span-1 space-y-4">
            <CurrencyPairSelector
              selectedPair={selectedPair}
              onPairChange={setSelectedPair}
              tradingViewData={currentData}
            />

            <TimeframeSelector
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />

            <TechnicalIndicators
              data={historicalData}
              pair={selectedPair}
              timeframe={selectedTimeframe}
              tradingViewData={currentData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
