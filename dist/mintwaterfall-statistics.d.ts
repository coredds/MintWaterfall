import * as d3 from 'd3';
export interface StatisticalSummary {
    count: number;
    sum: number;
    mean: number;
    median: number;
    variance: number;
    standardDeviation: number;
    min: number;
    max: number;
    range: number;
    quartiles: {
        q1: number;
        q2: number;
        q3: number;
        iqr: number;
    };
    percentiles: {
        p5: number;
        p10: number;
        p25: number;
        p75: number;
        p90: number;
        p95: number;
    };
}
export interface OutlierAnalysis {
    outliers: Array<{
        value: number;
        index: number;
        label?: string;
        severity: 'mild' | 'extreme';
        type: 'lower' | 'upper';
    }>;
    cleanData: Array<{
        value: number;
        index: number;
        label?: string;
    }>;
    summary: {
        totalOutliers: number;
        mildOutliers: number;
        extremeOutliers: number;
        outlierPercentage: number;
    };
}
export interface DataQualityAssessment {
    completeness: number;
    consistency: number;
    accuracy: number;
    validity: number;
    duplicates: number;
    anomalies: OutlierAnalysis;
    recommendations: string[];
}
export interface VarianceAnalysis {
    totalVariance: number;
    positiveVariance: number;
    negativeVariance: number;
    varianceContributions: Array<{
        label: string;
        value: number;
        variance: number;
        contribution: number;
    }>;
    significantFactors: Array<{
        label: string;
        impact: 'high' | 'medium' | 'low';
        variance: number;
    }>;
}
export interface TrendAnalysis {
    slope: number;
    correlation: number;
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: 'strong' | 'moderate' | 'weak';
    confidence: number;
    projectedValues: Array<{
        period: number;
        value: number;
        confidence: {
            lower: number;
            upper: number;
        };
    }>;
}
export interface StatisticalSystem {
    calculateSummary(data: number[]): StatisticalSummary;
    detectOutliers(data: number[], labels?: string[]): OutlierAnalysis;
    assessDataQuality(data: any[], options?: DataQualityOptions): DataQualityAssessment;
    analyzeVariance(data: Array<{
        label: string;
        value: number;
    }>): VarianceAnalysis;
    analyzeTrend(data: Array<{
        x: number;
        y: number;
    }>): TrendAnalysis;
    createBisector<T>(accessor: (d: T) => number): d3.Bisector<T, number>;
    createSearch<T>(data: T[], accessor: (d: T) => number): (value: number) => T | undefined;
    calculateMovingAverage(data: number[], window: number): number[];
    calculateExponentialSmoothing(data: number[], alpha: number): number[];
    detectSeasonality(data: number[], period: number): boolean;
}
export interface DataQualityOptions {
    expectedRange?: [number, number];
    allowedTypes?: string[];
    nullTolerance?: number;
    duplicateTolerance?: number;
}
export declare function createStatisticalSystem(): StatisticalSystem;
/**
 * Analyze waterfall chart statistical patterns
 * Provides insights specific to waterfall financial data
 */
export declare function analyzeWaterfallStatistics(data: Array<{
    label: string;
    value: number;
}>, options?: {
    includeTotal?: boolean;
    currency?: boolean;
}): {
    summary: StatisticalSummary;
    variance: VarianceAnalysis;
    quality: DataQualityAssessment;
    insights: string[];
};
export default createStatisticalSystem;
//# sourceMappingURL=mintwaterfall-statistics.d.ts.map