
import { TradingViewData, CandlestickData } from '@/hooks/useTradingViewData';

interface AnalysisResult {
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  indicators: {
    rsi: { value: number; signal: string };
    macd: { value: number; signal: string };
    bollinger: { position: number; signal: string };
    sma: { value: number; signal: string };
  };
  patterns: Array<{
    name: string;
    confidence: number;
    direction: 'bullish' | 'bearish';
  }>;
}

export class TradingViewAnalysisEngine {
  private data: CandlestickData[];
  private currentPrice: number;

  constructor(historicalData: CandlestickData[], currentData: TradingViewData | null) {
    this.data = historicalData;
    this.currentPrice = currentData?.price || 0;
  }

  // Comprehensive analysis using TradingView data
  analyze(): AnalysisResult {
    if (this.data.length < 20) {
      return this.getDefaultAnalysis();
    }

    const indicators = this.calculateIndicators();
    const patterns = this.detectPatterns();
    const signal = this.generateSignal(indicators, patterns);

    return {
      signal,
      confidence: this.calculateConfidence(indicators, patterns),
      indicators,
      patterns
    };
  }

  private calculateIndicators() {
    const closes = this.data.map(d => d.close);
    
    return {
      rsi: this.calculateRSI(closes),
      macd: this.calculateMACD(closes),
      bollinger: this.calculateBollingerBands(closes),
      sma: this.calculateSMA(closes, 20)
    };
  }

  private calculateRSI(prices: number[], period: number = 14) {
    if (prices.length < period + 1) {
      return { value: 50, signal: 'NEUTRAL' };
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return {
      value: rsi,
      signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL'
    };
  }

  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    return {
      value: macdLine,
      signal: macdLine > 0 ? 'BUY' : 'SELL'
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private calculateBollingerBands(prices: number[]) {
    const period = 20;
    if (prices.length < period) {
      return { position: 0.5, signal: 'NEUTRAL' };
    }

    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((a, b) => a + b, 0) / period;
    const variance = recentPrices.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upperBand = sma + (stdDev * 2);
    const lowerBand = sma - (stdDev * 2);
    const position = (this.currentPrice - lowerBand) / (upperBand - lowerBand);

    return {
      position,
      signal: position > 0.8 ? 'SELL' : position < 0.2 ? 'BUY' : 'NEUTRAL'
    };
  }

  private calculateSMA(prices: number[], period: number) {
    if (prices.length < period) {
      return { value: this.currentPrice, signal: 'NEUTRAL' };
    }

    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((a, b) => a + b, 0) / period;

    return {
      value: sma,
      signal: this.currentPrice > sma ? 'BUY' : 'SELL'
    };
  }

  private detectPatterns() {
    const patterns = [];

    // Head and Shoulders
    const headShoulders = this.detectHeadAndShoulders();
    if (headShoulders.detected) {
      patterns.push({
        name: 'Head and Shoulders',
        confidence: headShoulders.confidence,
        direction: 'bearish' as const
      });
    }

    // Double Top/Bottom
    const doublePattern = this.detectDoubleTopBottom();
    if (doublePattern.detected) {
      patterns.push({
        name: doublePattern.type,
        confidence: doublePattern.confidence,
        direction: doublePattern.direction as 'bullish' | 'bearish'
      });
    }

    // Support/Resistance
    const supportResistance = this.detectSupportResistance();
    if (supportResistance.detected) {
      patterns.push({
        name: 'Support/Resistance Break',
        confidence: supportResistance.confidence,
        direction: supportResistance.direction as 'bullish' | 'bearish'
      });
    }

    return patterns;
  }

  private detectHeadAndShoulders() {
    if (this.data.length < 20) return { detected: false, confidence: 0 };

    const highs = this.data.slice(-20).map(d => d.high);
    const peak1 = Math.max(...highs.slice(0, 6));
    const peak2 = Math.max(...highs.slice(7, 13));
    const peak3 = Math.max(...highs.slice(14, 20));

    const isValidPattern = peak2 > peak1 && peak2 > peak3 && Math.abs(peak1 - peak3) < peak1 * 0.005;

    return {
      detected: isValidPattern,
      confidence: isValidPattern ? 0.75 + Math.random() * 0.2 : 0
    };
  }

  private detectDoubleTopBottom() {
    if (this.data.length < 15) return { detected: false, confidence: 0, type: '', direction: '' };

    const recent = this.data.slice(-15);
    const firstHalf = recent.slice(0, 7).map(d => d.high);
    const secondHalf = recent.slice(8, 15).map(d => d.high);

    const firstExtreme = Math.max(...firstHalf);
    const secondExtreme = Math.max(...secondHalf);

    const isDoubleTop = Math.abs(firstExtreme - secondExtreme) < firstExtreme * 0.002;

    return {
      detected: isDoubleTop,
      type: isDoubleTop ? 'Double Top' : 'Double Bottom',
      direction: isDoubleTop ? 'bearish' : 'bullish',
      confidence: isDoubleTop ? 0.7 + Math.random() * 0.25 : 0
    };
  }

  private detectSupportResistance() {
    if (this.data.length < 30) return { detected: false, confidence: 0, direction: '' };

    const recent = this.data.slice(-30);
    const highs = recent.map(d => d.high);
    const lows = recent.map(d => d.low);

    const resistance = Math.max(...highs);
    const support = Math.min(...lows);

    const nearResistance = Math.abs(this.currentPrice - resistance) < resistance * 0.001;
    const nearSupport = Math.abs(this.currentPrice - support) < support * 0.001;

    if (nearResistance || nearSupport) {
      return {
        detected: true,
        confidence: 0.8,
        direction: nearResistance ? 'bearish' : 'bullish'
      };
    }

    return { detected: false, confidence: 0, direction: '' };
  }

  private generateSignal(indicators: any, patterns: any[]): 'BUY' | 'SELL' | 'NEUTRAL' {
    let bullishSignals = 0;
    let bearishSignals = 0;

    // Count indicator signals
    Object.values(indicators).forEach((indicator: any) => {
      if (indicator.signal === 'BUY') bullishSignals++;
      if (indicator.signal === 'SELL') bearishSignals++;
    });

    // Count pattern signals
    patterns.forEach(pattern => {
      if (pattern.direction === 'bullish') bullishSignals++;
      if (pattern.direction === 'bearish') bearishSignals++;
    });

    if (bullishSignals > bearishSignals) return 'BUY';
    if (bearishSignals > bullishSignals) return 'SELL';
    return 'NEUTRAL';
  }

  private calculateConfidence(indicators: any, patterns: any[]): number {
    const totalSignals = Object.keys(indicators).length + patterns.length;
    if (totalSignals === 0) return 0.5;

    let strongSignals = 0;
    
    // Count strong indicator signals
    if (indicators.rsi.value > 70 || indicators.rsi.value < 30) strongSignals++;
    if (Math.abs(indicators.macd.value) > 0.001) strongSignals++;
    if (indicators.bollinger.position > 0.8 || indicators.bollinger.position < 0.2) strongSignals++;

    // Count strong patterns
    patterns.forEach(pattern => {
      if (pattern.confidence > 0.7) strongSignals++;
    });

    return Math.min(0.9, 0.5 + (strongSignals / totalSignals) * 0.4);
  }

  private getDefaultAnalysis(): AnalysisResult {
    return {
      signal: 'NEUTRAL',
      confidence: 0.5,
      indicators: {
        rsi: { value: 50, signal: 'NEUTRAL' },
        macd: { value: 0, signal: 'NEUTRAL' },
        bollinger: { position: 0.5, signal: 'NEUTRAL' },
        sma: { value: this.currentPrice, signal: 'NEUTRAL' }
      },
      patterns: []
    };
  }
}
