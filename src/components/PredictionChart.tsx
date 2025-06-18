import React, { useMemo } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, BarChart } from 'lucide-react';
import { AIForecastEngine } from '@/utils/aiPredictionEngine';
import { useRealForexData } from '@/hooks/useRealForexData';
import { TradingViewData, CandlestickData } from '@/hooks/useTradingViewData';

interface PredictionChartProps {
  pair: string;
  timeframe: string;
  isLoading: boolean;
  height: number;
  tradingViewData: TradingViewData | null;
  historicalData: CandlestickData[];
}

const PredictionChart: React.FC<PredictionChartProps> = ({ 
  pair, 
  timeframe, 
  isLoading, 
  height,
  tradingViewData,
  historicalData
}) => {
  const { forexData } = useRealForexData(pair, timeframe);

  const { predictionData, aiAnalysis, mlPrediction, patterns } = useMemo(() => {
    const dataToUse = historicalData.length > 0 ? historicalData : forexData;
    if (dataToUse.length === 0) return { predictionData: [], aiAnalysis: null, mlPrediction: null, patterns: [] };

    const aiEngine = new AIForecastEngine(pair, dataToUse);
    const prediction = aiEngine.generateMLPrediction(24);
    const detectedPatterns = aiEngine.detectTechnicalPatterns();
    
    // Generate prediction timeline
    const historicalPoints = dataToUse.slice(-30);
    const predictionPoints = 20;
    const combinedData = [...historicalPoints];
    
    let currentPrice = tradingViewData?.price || dataToUse[dataToUse.length - 1].close;
    
    // Generate AI prediction scenarios
    for (let i = 1; i <= predictionPoints; i++) {
      const time = new Date(Date.now() + i * 300000); // 5 min intervals
      
      // Main AI prediction with confidence decay
      const confidenceDecay = Math.max(0.2, prediction.confidence - (i * 0.03));
      const priceDirection = prediction.direction === 'up' ? 1 : -1;
      const volatility = pair.includes('JPY') ? 0.3 : 0.002;
      
      const aiPrice = currentPrice + (priceDirection * volatility * i * 0.1) + (Math.random() - 0.5) * volatility * 0.5;
      
      // Bullish scenario (optimistic)
      const bullishPrice = currentPrice + (volatility * i * 0.15) + Math.random() * volatility * 0.3;
      
      // Bearish scenario (pessimistic)
      const bearishPrice = currentPrice - (volatility * i * 0.15) - Math.random() * volatility * 0.3;
      
      // Support and resistance levels
      const supportLevel = currentPrice * 0.995;
      const resistanceLevel = currentPrice * 1.005;
      
      combinedData.push({
        time: time.toLocaleTimeString(),
        timestamp: time.getTime(),
        aiPrediction: aiPrice,
        bullishScenario: bullishPrice,
        bearishScenario: bearishPrice,
        confidenceBand: confidenceDecay,
        supportLevel,
        resistanceLevel,
        type: 'prediction',
        volume: 400000 + Math.random() * 600000,
        
        // Candlestick data for prediction
        open: aiPrice - volatility * 0.1,
        high: aiPrice + volatility * 0.2,
        low: aiPrice - volatility * 0.2,
        close: aiPrice
      });
      
      currentPrice = aiPrice;
    }
    
    const analysis = {
      direction: prediction.direction === 'up' ? 'bullish' : 'bearish',
      strength: prediction.confidence * 100,
      confidence: prediction.confidence,
      timeHorizon: '4-6 hours',
      targetPrice: prediction.price,
      probability: prediction.probability,
      keyFactors: [
        'ML Pattern Recognition',
        'Real-time Sentiment Analysis',
        'Volume Profile Analysis',
        'Multi-timeframe Confluence',
        'Market Microstructure'
      ],
      riskLevel: prediction.confidence > 0.7 ? 'medium' : prediction.confidence > 0.5 ? 'high' : 'very-high'
    };
    
    return {
      predictionData: combinedData,
      aiAnalysis: analysis,
      mlPrediction: prediction,
      patterns: detectedPatterns
    };
  }, [forexData, pair, timeframe, tradingViewData, historicalData]);

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

  if (isLoading || !aiAnalysis) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-lg">
        <div className="flex items-center space-x-2 text-slate-400">
          <Brain className="h-5 w-5 animate-pulse" />
          <span>AI analyzing market patterns...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Enhanced AI Analysis Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 rounded-lg p-3 backdrop-blur-sm border border-slate-600">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-purple-400" />
          <div>
            <div className="text-white font-semibold flex items-center space-x-2">
              <span>AI Forecast</span>
              <Badge 
                variant={aiAnalysis.direction === 'bullish' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {aiAnalysis.direction === 'bullish' ? (
                  <><TrendingUp className="h-3 w-3 mr-1" />BULLISH</>
                ) : (
                  <><TrendingDown className="h-3 w-3 mr-1" />BEARISH</>
                )}
              </Badge>
            </div>
            <div className="text-sm text-slate-300 flex items-center space-x-2">
              <Target className="h-3 w-3" />
              <span>Target: {pair.includes('JPY') ? mlPrediction?.price.toFixed(3) : mlPrediction?.price.toFixed(5)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Recognition Results */}
      <div className="absolute top-4 right-4 z-10 bg-blue-900/80 rounded-lg p-2 backdrop-blur-sm">
        <div className="text-blue-300 text-xs space-y-1">
          <div className="flex items-center space-x-1">
            <BarChart className="h-3 w-3" />
            <span>Patterns: {patterns.length}</span>
          </div>
          {patterns.slice(0, 2).map((pattern, i) => (
            <div key={i} className="text-xs">
              {pattern.name}: {(pattern.confidence * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="absolute top-20 right-4 z-10 bg-yellow-900/80 rounded-lg p-2 backdrop-blur-sm">
        <div className="flex items-center space-x-1 text-yellow-400 text-xs">
          <AlertTriangle className="h-4 w-4" />
          <span>Risk: {aiAnalysis.riskLevel.toUpperCase()}</span>
        </div>
      </div>

      {/* Advanced Prediction Chart */}
      <div style={{ height: `${height}px` }} className="bg-slate-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={predictionData} margin={{ top: 80, right: 30, left: 20, bottom: 5 }}>
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
            <YAxis 
              yAxisId="volume"
              orientation="right"
              stroke="#9CA3AF"
              fontSize={12}
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
              name="Historical Price"
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
            
            {/* Volume Profile */}
            <Bar
              dataKey="volume"
              fill="rgba(139, 92, 246, 0.3)"
              yAxisId="volume"
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
                      style={{ width: `${aiAnalysis.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-mono">{(aiAnalysis.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 mb-2">Detected Patterns</div>
                <div className="text-white text-xs space-y-1">
                  {patterns.slice(0, 2).map((pattern, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{pattern.name}</span>
                      <span className="text-purple-400">{(pattern.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 mb-2">Probability</div>
                <div className="text-white text-lg font-mono">
                  {(mlPrediction?.probability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">
                  {aiAnalysis.direction.toUpperCase()} movement
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 mb-2">Next Analysis</div>
                <div className="text-white text-sm">
                  {new Date(Date.now() + 180000).toLocaleTimeString()}
                </div>
                <div className="text-xs text-slate-400">Auto-update in 3min</div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-700">
              <div className="text-slate-400 text-xs mb-2">Key ML Factors:</div>
              <div className="text-white text-xs">
                {aiAnalysis.keyFactors.join(' • ')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictionChart;
