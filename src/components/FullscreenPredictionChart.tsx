
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Maximize2, Brain, TrendingUp, TrendingDown } from 'lucide-react';
import PredictionChart from './PredictionChart';
import { TradingViewData, CandlestickData } from '@/hooks/useTradingViewData';

interface FullscreenPredictionChartProps {
  pair: string;
  timeframe: string;
  tradingViewData: TradingViewData | null;
  historicalData: CandlestickData[];
  onClose: () => void;
}

const FullscreenPredictionChart: React.FC<FullscreenPredictionChartProps> = ({
  pair,
  timeframe,
  tradingViewData,
  historicalData,
  onClose
}) => {
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
          </div>
          
          <div className="flex items-center space-x-2">
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
          <PredictionChart
            pair={pair}
            timeframe={timeframe}
            isLoading={false}
            height={window.innerHeight - 120}
            tradingViewData={tradingViewData}
            historicalData={historicalData}
          />
        </div>
      </div>
    </div>
  );
};

export default FullscreenPredictionChart;
