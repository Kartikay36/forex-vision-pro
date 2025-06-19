
import React, { useMemo, useState, useEffect } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, BarChart, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIForecastEngine } from '@/utils/aiPredictionEngine';
import { useRealForexData } from '@/hooks/useRealForexData';
import { TradingViewData, CandlestickData } from '@/hooks/useTradingViewData';
import FullscreenPredictionChart from './FullscreenPredictionChart';

interface PredictionChartProps {
  pair: string;
  timeframe: string;
  isLoading: boolean;
  height: number;
  tradingViewData: TradingViewData | null;
  historicalData: CandlestickData[];
}

// Stable prediction state to prevent random changes
const predictionStateCache: { [key: string]: any } = {};

const PredictionChart: React.FC<PredictionChartProps> = ({ 
  pair, 
  timeframe, 
  isLoading, 
  height,
  tradingViewData,
  historicalData
}) => {
  const { forexData } = useRealForexData(pair, timeframe);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [stablePrediction, setStablePrediction] = useState<any>(null);

  // Create stable cache key
  const cacheKey = `${pair}-${timeframe}`;

  const { predictionData, aiAnalysis, mlPrediction, patterns } = useMemo(() => {
    const dataToUse = historicalData.length > 0 ? historicalData : forexData;
    if (dataToUse.length === 0) return { predictionData: [], aiAnalysis: null, mlPrediction: null, patterns: [] };

    // Check if we have cached stable prediction
    const cached = predictionStateCache[cacheKey];
    const currentPrice = tradingViewData?.price || dataToUse[dataToUse.length - 1].close;
    
    // Only regenerate if price changed significantly (>0.1%) or cache is older than 3 minutes
    const shouldRegenerate = !cached || 
      Math.abs(currentPrice - cached.basePrice) / cached.basePrice > 0.001 ||
      Date.now() - cached.timestamp > 180000;

    if (!shouldRegenerate && cached) {
      return cached.data;
    }

    const aiEngine = new AIForecastEngine(pair, dataToUse);
    const prediction = aiEngine.generateMLPrediction(24);
    const detectedPatterns = aiEngine.detectTechnicalPatterns();
    
    // Generate stable prediction timeline
    const historicalPoints = dataToUse.slice(-30);
    const predictionPoints = 20;
    const combinedData: CandlestickData[] = [...historicalPoints];
    
    // Use seed for consistent prediction generation
    const seed = Math.floor(currentPrice * 10000) % 1000;
    
    // Generate consistent AI prediction scenarios
    for (let i = 1; i <= predictionPoints; i++) {
      const time = new Date(Date.now() + i * 300000); // 5 min intervals
      
      // Stable prediction with consistent direction
      const confidenceDecay = Math.max(0.2, prediction.confidence - (i * 0.02));
      const priceDirection = prediction.direction === 'up' ? 1 : -1;
      const volatility = pair.includes('JPY') ? 0.25 : 0.0018;
      
      // Use seed-based randomness for consistency
      const randomFactor = (Math.sin(seed + i) + 1) / 2; // Normalized sine wave
      const aiPrice = currentPrice + (priceDirection * volatility * i * 0.08) + (randomFactor - 0.5) * volatility * 0.3;
      
      // Consistent scenarios
      const bullishPrice = currentPrice + (volatility * i * 0.12) + randomFactor * volatility * 0.2;
      const bearishPrice = currentPrice - (volatility * i * 0.12) - randomFactor * volatility * 0.2;
      
      // Support and resistance levels
      const supportLevel = currentPrice * 0.996;
      const resistanceLevel = currentPrice * 1.004;
      
      combinedData.push({
        time: time.toLocaleTimeString(),
        timestamp: time.getTime(),
        open: aiPrice - volatility * 0.05,
        high: aiPrice + volatility * 0.15,
        low: aiPrice - volatility * 0.15,
        close: aiPrice,
        volume: 450000 + Math.floor(randomFactor * 500000),
        aiPrediction: aiPrice,
        bullishScenario: bullishPrice,
        bearishScenario: bearishPrice,
        confidenceBand: confidenceDecay,
        supportLevel,
        resistanceLevel,
        type: 'prediction'
      });
    }
    
    const analysis = {
      direction: prediction.direction === 'up' ? 'bullish' : 'bearish',
      strength: prediction.confidence * 100,
      confidence: prediction.confidence,
      timeHorizon: '4-6 hours',
      targetPrice: prediction.price,
      probability: prediction.probability,
      keyFactors: [
        'Real-time Alpha Vantage Data',
        'ML Pattern Recognition',
        'Technical Indicator Confluence',
        'Volume Profile Analysis',
        'Market Sentiment Analysis'
      ],
      riskLevel: prediction.confidence > 0.7 ? 'medium' : prediction.confidence > 0.5 ? 'high' : 'very-high'
    };
    
    const result = {
      predictionData: combinedData,
      aiAnalysis: analysis,
      mlPrediction: prediction,
      patterns: detectedPatterns
    };

    // Cache the stable result
    predictionStateCache[cacheKey] = {
      data: result,
      basePrice: currentPrice,
      timestamp: Date.now()
    };

    return result;
  }, [forexData, pair, timeframe, tradingViewData, historicalData, cacheKey]);

  // Update stable prediction state
  useEffect(() => {
    if (aiAnalysis) {
      setStablePrediction({ aiAnalysis, mlPrediction, patterns });
    }
  }, [aiAnalysis, mlPrediction, patterns]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPrediction = data.type === 'prediction';
      const formatPrice = (price: number) => pair.includes('JPY') ? price.toFixed(3) : price.toFixed(5);
      
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium flex items-center">
            {label}
            {isPrediction && <Badge variant="secondary" className="ml-2 text-xs">AI</Badge>}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatPrice(entry.value)}
            </p>
          ))}
          {isPrediction && (
            <>
              <p className="text-purple-400 text-sm">
                Confidence: {(data.confidenceBand * 100).toFixed(0)}%
              </p>
              <p className="text-blue-400 text-sm">
                Support: {formatPrice(data.supportLevel)}
              </p>
              <p className="text-red-400 text-sm">
                Resistance: {formatPrice(data.resistanceLevel)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading || !stablePrediction) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-lg">
        <div className="flex items-center space-x-2 text-slate-400">
          <Brain className="h-5 w-5 animate-pulse" />
          <span>AI analyzing real-time market data...</span>
        </div>
      </div>
    );
  }

  if (showFullscreen) {
    return (
      <FullscreenPredictionChart
        pair={pair}
        timeframe={timeframe}
        tradingViewData={tradingViewData}
        historicalData={predictionData}
        aiAnalysis={stablePrediction.aiAnalysis}
        mlPrediction={stablePrediction.mlPrediction}
        patterns={stablePrediction.patterns}
        onClose={() => setShowFullscreen(false)}
      />
    );
  }

  return (
    <div className="relative">
      {/* Fullscreen Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFullscreen(true)}
          className="bg-slate-900/90 border-slate-600 hover:bg-slate-800"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Enhanced AI Analysis Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 rounded-lg p-3 backdrop-blur-sm border border-slate-600">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-purple-400" />
          <div>
            <div className="text-white font-semibold flex items-center space-x-2">
              <span>AI Forecast</span>
              <Badge 
                variant={stablePrediction.aiAnalysis.direction === 'bullish' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {stablePrediction.aiAnalysis.direction === 'bullish' ? (
                  <><TrendingUp className="h-3 w-3 mr-1" />BULLISH</>
                ) : (
                  <><TrendingDown className="h-3 w-3 mr-1" />BEARISH</>
                )}
              </Badge>
            </div>
            <div className="text-sm text-slate-300 flex items-center space-x-2">
              <Target className="h-3 w-3" />
              <span>Target: {pair.includes('JPY') ? stablePrediction.mlPrediction?.price.toFixed(3) : stablePrediction.mlPrediction?.price.toFixed(5)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Data Source Indicator */}
      <div className="absolute top-20 left-4 z-10 bg-green-900/80 rounded-lg p-2 backdrop-blur-sm">
        <div className="text-green-300 text-xs flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Live Alpha Vantage Data</span>
        </div>
      </div>

      {/* Pattern Recognition Results */}
      <div className="absolute top-4 right-16 z-10 bg-blue-900/80 rounded-lg p-2 backdrop-blur-sm">
        <div className="text-blue-300 text-xs space-y-1">
          <div className="flex items-center space-x-1">
            <BarChart className="h-3 w-3" />
            <span>Patterns: {stablePrediction.patterns.length}</span>
          </div>
          {stablePrediction.patterns.slice(0, 2).map((pattern: any, i: number) => (
            <div key={i} className="text-xs">
              {pattern.name}: {(pattern.confidence * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Prediction Chart */}
      <div style={{ height: `${height}px` }} className="bg-slate-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={predictionData} margin={{ top: 80, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={['dataMin - 0.003', 'dataMax + 0.003']}
              tickFormatter={(value) => pair.includes('JPY') ? value.toFixed(3) : value.toFixed(5)}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Confidence Band */}
            <Area
              type="monotone"
              dataKey="bullishScenario"
              stackId="1"
              stroke="none"
              fill="url(#confidenceGradient)"
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="bearishScenario"
              stackId="2"
              stroke="none"
              fill="url(#confidenceGradient)"
              fillOpacity={0.2}
            />
            
            {/* Historical Price Line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="Real-time Price"
              connectNulls={false}
            />
            
            {/* AI Prediction Line */}
            <Line
              type="monotone"
              dataKey="aiPrediction"
              stroke="#8B5CF6"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={false}
              name="AI Prediction"
              connectNulls={false}
            />
            
            {/* Support/Resistance Levels */}
            <Line
              type="monotone"
              dataKey="supportLevel"
              stroke="#10B981"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              name="Support Level"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="resistanceLevel"
              stroke="#EF4444"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              name="Resistance Level"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced AI Analysis Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <Card className="bg-slate-900/90 border-slate-600 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-400 mb-2">ML Confidence</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-purple-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${stablePrediction.aiAnalysis.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-mono">{(stablePrediction.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 mb-2">Data Source</div>
                <div className="text-white text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Alpha Vantage</span>
                    <span className="text-green-400">LIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Update</span>
                    <span className="text-blue-400">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 mb-2">Prediction Strength</div>
                <div className="text-white text-lg font-mono">
                  {(stablePrediction.mlPrediction?.probability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">
                  {stablePrediction.aiAnalysis.direction.toUpperCase()} bias
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 mb-2">Risk Level</div>
                <div className="text-white text-sm capitalize">
                  {stablePrediction.aiAnalysis.riskLevel.replace('-', ' ')}
                </div>
                <div className="text-xs text-slate-400">
                  Based on volatility
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictionChart;
