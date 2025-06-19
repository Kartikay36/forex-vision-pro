
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Brain, TrendingUp, TrendingDown } from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TradingViewData, CandlestickData } from '@/hooks/useTradingViewData';

interface FullscreenPredictionChartProps {
  pair: string;
  timeframe: string;
  tradingViewData: TradingViewData | null;
  historicalData: CandlestickData[];
  aiAnalysis: any;
  mlPrediction: any;
  patterns: any[];
  onClose: () => void;
}

const FullscreenPredictionChart: React.FC<FullscreenPredictionChartProps> = ({
  pair,
  timeframe,
  tradingViewData,
  historicalData,
  aiAnalysis,
  mlPrediction,
  patterns,
  onClose
}) => {
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <Brain className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">AI Prediction Analysis</h2>
            <Badge variant="outline" className="text-xs">{pair}</Badge>
            <Badge variant="secondary" className="text-xs">{timeframe}</Badge>
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
          
          <div className="flex items-center space-x-4">
            {tradingViewData && (
              <div className="flex items-center space-x-2 text-white">
                <span className="font-mono text-lg">
                  {pair.includes('JPY') ? 
                    tradingViewData.price.toFixed(3) : 
                    tradingViewData.price.toFixed(5)
                  }
                </span>
                <div className={`flex items-center text-sm ${
                  tradingViewData.changePercent > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {tradingViewData.changePercent > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {tradingViewData.changePercent > 0 ? '+' : ''}{tradingViewData.changePercent.toFixed(2)}%
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Chart Content */}
        <div className="flex-1 p-4">
          <div className="h-full bg-slate-900/50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                  strokeWidth={3}
                  dot={false}
                  name="Real-time Price"
                  connectNulls={false}
                />
                
                {/* AI Prediction Line */}
                <Line
                  type="monotone"
                  dataKey="aiPrediction"
                  stroke="#8B5CF6"
                  strokeWidth={4}
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
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Support Level"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="resistanceLevel"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Resistance Level"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Analysis Panel */}
          <div className="mt-4">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-sm">
                  <div className="md:col-span-2">
                    <div className="text-slate-400 mb-3">ML Analysis Confidence</div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-4">
                        <div 
                          className="bg-purple-500 h-4 rounded-full transition-all duration-1000"
                          style={{ width: `${aiAnalysis.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-white font-mono text-lg">{(aiAnalysis.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Target: {pair.includes('JPY') ? mlPrediction?.price.toFixed(3) : mlPrediction?.price.toFixed(5)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 mb-3">Patterns Detected</div>
                    <div className="text-white text-xs space-y-1">
                      {patterns.slice(0, 3).map((pattern, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate mr-2">{pattern.name}</span>
                          <span className="text-purple-400">{(pattern.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 mb-3">Prediction Strength</div>
                    <div className="text-white text-2xl font-mono mb-1">
                      {(mlPrediction?.probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-400">
                      {aiAnalysis.direction.toUpperCase()} movement probability
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 mb-3">Data Source Status</div>
                    <div className="text-white text-sm space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span>Alpha Vantage Live</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Last: {new Date().toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        Risk: {aiAnalysis.riskLevel.replace('-', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="text-slate-400 text-sm mb-2">Key Analysis Factors:</div>
                  <div className="text-white text-sm">
                    {aiAnalysis.keyFactors.join(' • ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPredictionChart;
