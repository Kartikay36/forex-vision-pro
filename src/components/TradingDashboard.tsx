
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Fullscreen, TrendingUp, TrendingDown, Sun, Moon, Activity, Brain, Maximize2, Wifi } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import TradingViewChart from './TradingViewChart';
import PredictionChart from './PredictionChart';
import FullscreenPredictionChart from './FullscreenPredictionChart';
import SignalPanel from './SignalPanel';
import MarketStatus from './MarketStatus';
import CurrencyPairSelector from './CurrencyPairSelector';
import TimeframeSelector from './TimeframeSelector';
import TechnicalIndicators from './TechnicalIndicators';
import { useRealTimeForex } from '@/hooks/useRealTimeForex';
import { useMarketHours } from '@/hooks/useMarketHours';

const TradingDashboard = () => {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrediction, setShowFullscreenPrediction] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { realTimeData, forexData, isLoading, error, connectionStatus } = useRealTimeForex(selectedPair, selectedTimeframe);
  const { isMarketOpen, nextMarketEvent, marketSessions } = useMarketHours();

  // Generate simple AI analysis from the data we have
  const generateSimpleAnalysis = () => {
    if (!realTimeData || forexData.length === 0) return null;
    
    return {
      trend: realTimeData.changePercent > 0 ? 'bullish' : 'bearish',
      strength: Math.abs(realTimeData.changePercent) > 0.5 ? 'strong' : 'weak',
      support: Math.min(...forexData.slice(-10).map(d => d.low)),
      resistance: Math.max(...forexData.slice(-10).map(d => d.high)),
    };
  };

  const generateSimplePrediction = () => {
    if (!realTimeData || forexData.length === 0) return null;
    
    return {
      direction: realTimeData.changePercent > 0 ? 'up' : 'down',
      confidence: Math.min(Math.abs(realTimeData.changePercent) * 20, 85),
      target: realTimeData.price * (1 + (realTimeData.changePercent > 0 ? 0.001 : -0.001)),
    };
  };

  const aiAnalysis = generateSimpleAnalysis();
  const mlPrediction = generateSimplePrediction();
  const patterns = [];

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
      {showFullscreenPrediction && aiAnalysis && mlPrediction && (
        <FullscreenPredictionChart
          pair={selectedPair}
          timeframe={selectedTimeframe}
          tradingViewData={realTimeData}
          historicalData={forexData}
          aiAnalysis={aiAnalysis}
          mlPrediction={mlPrediction}
          patterns={patterns}
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
              <Badge 
                variant={connectionStatus === 'connected' ? "default" : "outline"} 
                className="text-xs flex items-center"
              >
                <Wifi className="h-3 w-3 mr-1" />
                Real-time Data
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
                  />
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>AI Predictions</span>
                      <Badge variant="secondary" className="text-xs">Live Data</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullscreenPrediction(true)}
                      className="text-xs"
                      disabled={!aiAnalysis || !mlPrediction}
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
                    tradingViewData={realTimeData}
                    historicalData={forexData}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Trading Signals */}
            <SignalPanel
              pair={selectedPair}
              timeframe={selectedTimeframe}
              data={forexData}
              isMarketOpen={isMarketOpen}
              tradingViewData={realTimeData}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h Change</div>
                  <div className={`text-lg font-semibold flex items-center ${
                    realTimeData?.changePercent && realTimeData.changePercent > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {realTimeData?.changePercent && realTimeData.changePercent > 0 ? 
                      <TrendingUp className="h-4 w-4 mr-1" /> : 
                      <TrendingDown className="h-4 w-4 mr-1" />
                    }
                    {realTimeData?.changePercent?.toFixed(2) || '0.00'}%
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h High</div>
                  <div className="text-lg font-semibold text-foreground">
                    {realTimeData?.high ? 
                      (selectedPair.includes('JPY') ? realTimeData.high.toFixed(3) : realTimeData.high.toFixed(5)) :
                      '--'
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">24h Low</div>
                  <div className="text-lg font-semibold text-foreground">
                    {realTimeData?.low ? 
                      (selectedPair.includes('JPY') ? realTimeData.low.toFixed(3) : realTimeData.low.toFixed(5)) :
                      '--'
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Spread</div>
                  <div className="text-lg font-semibold text-yellow-500">
                    {realTimeData?.ask && realTimeData?.bid ? 
                      (selectedPair.includes('JPY') ? 
                        (realTimeData.ask - realTimeData.bid).toFixed(3) : 
                        (realTimeData.ask - realTimeData.bid).toFixed(5)
                      ) : '--'
                    }
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
              tradingViewData={realTimeData}
            />

            <TimeframeSelector
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />

            <TechnicalIndicators
              data={forexData}
              pair={selectedPair}
              timeframe={selectedTimeframe}
              tradingViewData={realTimeData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
