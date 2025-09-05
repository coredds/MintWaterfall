// MintWaterfall Advanced Statistical Analysis - TypeScript Version
// Provides comprehensive statistical analysis features for waterfall chart data

import * as d3 from 'd3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
        q2: number; // median
        q3: number;
        iqr: number; // interquartile range
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
    completeness: number; // percentage of non-null values
    consistency: number; // coefficient of variation
    accuracy: number; // percentage within expected range
    validity: number; // percentage of valid data types
    duplicates: number; // count of duplicate values
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
        contribution: number; // percentage of total variance
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
        confidence: { lower: number; upper: number };
    }>;
}

export interface StatisticalSystem {
    // Core statistical functions
    calculateSummary(data: number[]): StatisticalSummary;
    detectOutliers(data: number[], labels?: string[]): OutlierAnalysis;
    assessDataQuality(data: any[], options?: DataQualityOptions): DataQualityAssessment;
    
    // Advanced analysis
    analyzeVariance(data: Array<{label: string, value: number}>): VarianceAnalysis;
    analyzeTrend(data: Array<{x: number, y: number}>): TrendAnalysis;
    
    // Data search and optimization
    createBisector<T>(accessor: (d: T) => number): d3.Bisector<T, number>;
    createSearch<T>(data: T[], accessor: (d: T) => number): (value: number) => T | undefined;
    
    // Utility functions
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

// ============================================================================
// STATISTICAL SYSTEM IMPLEMENTATION
// ============================================================================

export function createStatisticalSystem(): StatisticalSystem {

    // ========================================================================
    // CORE STATISTICAL FUNCTIONS
    // ========================================================================

    /**
     * Calculate comprehensive statistical summary
     * Enhanced with D3.js statistical functions
     */
    function calculateSummary(data: number[]): StatisticalSummary {
        // Filter out null/undefined values
        const cleanData = data.filter(d => d != null && !isNaN(d)).sort(d3.ascending);
        
        if (cleanData.length === 0) {
            throw new Error('No valid data points for statistical analysis');
        }

        const count = cleanData.length;
        const sum = d3.sum(cleanData);
        const mean = d3.mean(cleanData) || 0;
        const median = d3.median(cleanData) || 0;
        const variance = d3.variance(cleanData) || 0;
        const standardDeviation = d3.deviation(cleanData) || 0;
        const min = d3.min(cleanData) || 0;
        const max = d3.max(cleanData) || 0;
        const range = max - min;

        // Calculate quartiles
        const q1 = d3.quantile(cleanData, 0.25) || 0;
        const q2 = median;
        const q3 = d3.quantile(cleanData, 0.75) || 0;
        const iqr = q3 - q1;

        // Calculate percentiles
        const percentiles = {
            p5: d3.quantile(cleanData, 0.05) || 0,
            p10: d3.quantile(cleanData, 0.10) || 0,
            p25: q1,
            p75: q3,
            p90: d3.quantile(cleanData, 0.90) || 0,
            p95: d3.quantile(cleanData, 0.95) || 0
        };

        return {
            count,
            sum,
            mean,
            median,
            variance,
            standardDeviation,
            min,
            max,
            range,
            quartiles: { q1, q2, q3, iqr },
            percentiles
        };
    }

    /**
     * Detect outliers using IQR method and modified Z-score
     * Enhanced with severity classification
     */
    function detectOutliers(data: number[], labels: string[] = []): OutlierAnalysis {
        const summary = calculateSummary(data);
        const { q1, q3, iqr } = summary.quartiles;
        
        // IQR method boundaries
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const extremeLowerBound = q1 - 3 * iqr;
        const extremeUpperBound = q3 + 3 * iqr;

        const outliers: OutlierAnalysis['outliers'] = [];
        const cleanData: OutlierAnalysis['cleanData'] = [];

        data.forEach((value, index) => {
            if (value == null || isNaN(value)) return;

            const isOutlier = value < lowerBound || value > upperBound;
            const isExtreme = value < extremeLowerBound || value > extremeUpperBound;

            if (isOutlier) {
                outliers.push({
                    value,
                    index,
                    label: labels[index],
                    severity: isExtreme ? 'extreme' : 'mild',
                    type: value < lowerBound ? 'lower' : 'upper'
                });
            } else {
                cleanData.push({
                    value,
                    index,
                    label: labels[index]
                });
            }
        });

        const mildOutliers = outliers.filter(o => o.severity === 'mild').length;
        const extremeOutliers = outliers.filter(o => o.severity === 'extreme').length;

        return {
            outliers,
            cleanData,
            summary: {
                totalOutliers: outliers.length,
                mildOutliers,
                extremeOutliers,
                outlierPercentage: (outliers.length / data.length) * 100
            }
        };
    }

    /**
     * Assess overall data quality
     * Provides actionable recommendations for data improvement
     */
    function assessDataQuality(
        data: any[], 
        options: DataQualityOptions = {}
    ): DataQualityAssessment {
        const {
            expectedRange,
            allowedTypes = ['number'],
            nullTolerance = 0.05, // 5% null tolerance
            duplicateTolerance = 0.1 // 10% duplicate tolerance
        } = options;

        const totalCount = data.length;
        let validCount = 0;
        let nullCount = 0;
        let typeValidCount = 0;
        let rangeValidCount = 0;
        const duplicates = new Set();
        const seen = new Set();

        // Analyze each data point
        data.forEach(item => {
            // Check for null/undefined
            if (item == null) {
                nullCount++;
                return;
            }

            validCount++;

            // Check data type
            const itemType = typeof item;
            if (allowedTypes.includes(itemType)) {
                typeValidCount++;
            }

            // Check range (for numbers)
            if (typeof item === 'number' && expectedRange) {
                if (item >= expectedRange[0] && item <= expectedRange[1]) {
                    rangeValidCount++;
                }
            } else if (!expectedRange) {
                rangeValidCount++; // No range constraint
            }

            // Check duplicates
            const itemStr = JSON.stringify(item);
            if (seen.has(itemStr)) {
                duplicates.add(itemStr);
            } else {
                seen.add(itemStr);
            }
        });

        // Calculate quality metrics
        const completeness = ((totalCount - nullCount) / totalCount) * 100;
        const validity = (typeValidCount / totalCount) * 100;
        const accuracy = (rangeValidCount / totalCount) * 100;
        
        // Consistency (coefficient of variation for numeric data)
        const numericData = data.filter(d => typeof d === 'number' && !isNaN(d));
        const cv = numericData.length > 0 ? 
            (d3.deviation(numericData) || 0) / (d3.mean(numericData) || 1) : 0;
        const consistency = Math.max(0, 100 - (cv * 100)); // Invert CV for consistency score

        // Outlier analysis for numeric data
        const anomalies = numericData.length > 0 ? 
            detectOutliers(numericData) : 
            { outliers: [], cleanData: [], summary: { totalOutliers: 0, mildOutliers: 0, extremeOutliers: 0, outlierPercentage: 0 } };

        // Generate recommendations
        const recommendations: string[] = [];
        if (completeness < (1 - nullTolerance) * 100) {
            recommendations.push(`Improve data completeness: ${nullCount} missing values detected`);
        }
        if (validity < 95) {
            recommendations.push(`Validate data types: ${totalCount - typeValidCount} invalid types found`);
        }
        if (accuracy < 90 && expectedRange) {
            recommendations.push(`Check data accuracy: ${totalCount - rangeValidCount} values outside expected range`);
        }
        if (duplicates.size > duplicateTolerance * totalCount) {
            recommendations.push(`Remove duplicates: ${duplicates.size} duplicate values detected`);
        }
        if (anomalies.summary.outlierPercentage > 5) {
            recommendations.push(`Investigate outliers: ${anomalies.summary.totalOutliers} outliers detected (${anomalies.summary.outlierPercentage.toFixed(1)}%)`);
        }

        return {
            completeness,
            consistency,
            accuracy,
            validity,
            duplicates: duplicates.size,
            anomalies,
            recommendations
        };
    }

    // ========================================================================
    // ADVANCED ANALYSIS FUNCTIONS
    // ========================================================================

    /**
     * Analyze variance contributions in waterfall data
     * Identifies key drivers of variability
     */
    function analyzeVariance(data: Array<{label: string, value: number}>): VarianceAnalysis {
        const values = data.map(d => d.value);
        const totalVariance = d3.variance(values) || 0;
        
        // Separate positive and negative contributions
        const positiveValues = values.filter(v => v > 0);
        const negativeValues = values.filter(v => v < 0);
        
        const positiveVariance = positiveValues.length > 0 ? (d3.variance(positiveValues) || 0) : 0;
        const negativeVariance = negativeValues.length > 0 ? (d3.variance(negativeValues) || 0) : 0;

        // Calculate individual contributions
        const mean = d3.mean(values) || 0;
        const varianceContributions = data.map(item => {
            const variance = Math.pow(item.value - mean, 2);
            const contribution = totalVariance > 0 ? (variance / totalVariance) * 100 : 0;
            return {
                label: item.label,
                value: item.value,
                variance,
                contribution
            };
        });

        // Identify significant factors (top contributors)
        const sortedContributions = [...varianceContributions].sort((a, b) => b.contribution - a.contribution);
        const significantFactors = sortedContributions.slice(0, Math.min(5, sortedContributions.length)).map(item => ({
            label: item.label,
            impact: item.contribution > 20 ? 'high' as const : 
                   item.contribution > 10 ? 'medium' as const : 'low' as const,
            variance: item.variance
        }));

        return {
            totalVariance,
            positiveVariance,
            negativeVariance,
            varianceContributions,
            significantFactors
        };
    }

    /**
     * Analyze trend patterns in time series data
     * Provides statistical trend analysis with confidence intervals
     */
    function analyzeTrend(data: Array<{x: number, y: number}>): TrendAnalysis {
        if (data.length < 2) {
            throw new Error('At least 2 data points required for trend analysis');
        }

        const xValues = data.map(d => d.x);
        const yValues = data.map(d => d.y);
        
        // Calculate linear regression
        const xMean = d3.mean(xValues) || 0;
        const yMean = d3.mean(yValues) || 0;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < data.length; i++) {
            const xDiff = xValues[i] - xMean;
            const yDiff = yValues[i] - yMean;
            numerator += xDiff * yDiff;
            denominator += xDiff * xDiff;
        }
        
        const slope = denominator !== 0 ? numerator / denominator : 0;
        
        // Calculate correlation coefficient
        const xStd = d3.deviation(xValues) || 0;
        const yStd = d3.deviation(yValues) || 0;
        const correlation = (xStd * yStd) !== 0 ? numerator / (Math.sqrt(denominator) * yStd * Math.sqrt(data.length - 1)) : 0;
        
        // Determine trend characteristics
        const direction = slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable';
        const strength = Math.abs(correlation) > 0.7 ? 'strong' : 
                        Math.abs(correlation) > 0.3 ? 'moderate' : 'weak';
        const confidence = Math.abs(correlation) * 100;

        // Generate projections (simple linear extrapolation)
        const lastX = Math.max(...xValues);
        const projectedValues = Array.from({ length: 3 }, (_, i) => {
            const period = lastX + (i + 1);
            const value = yMean + slope * (period - xMean);
            const standardError = Math.sqrt(d3.variance(yValues) || 0) / Math.sqrt(data.length);
            
            return {
                period,
                value,
                confidence: {
                    lower: value - (1.96 * standardError),
                    upper: value + (1.96 * standardError)
                }
            };
        });

        return {
            slope,
            correlation,
            direction,
            strength,
            confidence,
            projectedValues
        };
    }

    // ========================================================================
    // DATA SEARCH AND OPTIMIZATION
    // ========================================================================

    /**
     * Create efficient bisector for data searching
     * Uses D3.js bisector for O(log n) lookups
     */
    function createBisector<T>(accessor: (d: T) => number): d3.Bisector<T, number> {
        return d3.bisector(accessor);
    }

    /**
     * Create fast search function for sorted data
     * Returns the closest data point to a given value
     */
    function createSearch<T>(data: T[], accessor: (d: T) => number): (value: number) => T | undefined {
        const bisector = createBisector(accessor);
        const sortedData = [...data].sort((a, b) => d3.ascending(accessor(a), accessor(b)));
        
        return (value: number): T | undefined => {
            const index = bisector.left(sortedData, value);
            
            if (index === 0) return sortedData[0];
            if (index >= sortedData.length) return sortedData[sortedData.length - 1];
            
            // Return the closest value
            const leftItem = sortedData[index - 1];
            const rightItem = sortedData[index];
            
            const leftDistance = Math.abs(accessor(leftItem) - value);
            const rightDistance = Math.abs(accessor(rightItem) - value);
            
            return leftDistance <= rightDistance ? leftItem : rightItem;
        };
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Calculate moving average with configurable window
     */
    function calculateMovingAverage(data: number[], window: number): number[] {
        if (window <= 0 || window > data.length) {
            throw new Error('Invalid window size for moving average');
        }

        const result: number[] = [];
        for (let i = 0; i <= data.length - window; i++) {
            const windowData = data.slice(i, i + window);
            const average = d3.mean(windowData) || 0;
            result.push(average);
        }
        return result;
    }

    /**
     * Calculate exponential smoothing
     */
    function calculateExponentialSmoothing(data: number[], alpha: number): number[] {
        if (alpha < 0 || alpha > 1) {
            throw new Error('Alpha must be between 0 and 1');
        }

        const result: number[] = [];
        let smoothed = data[0];
        result.push(smoothed);

        for (let i = 1; i < data.length; i++) {
            smoothed = alpha * data[i] + (1 - alpha) * smoothed;
            result.push(smoothed);
        }

        return result;
    }

    /**
     * Detect seasonality in time series data
     */
    function detectSeasonality(data: number[], period: number): boolean {
        if (data.length < period * 2) {
            return false; // Need at least 2 full periods
        }

        // Calculate autocorrelation at the specified period
        const mean = d3.mean(data) || 0;
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < data.length - period; i++) {
            numerator += (data[i] - mean) * (data[i + period] - mean);
        }

        for (let i = 0; i < data.length; i++) {
            denominator += Math.pow(data[i] - mean, 2);
        }

        const autocorrelation = denominator !== 0 ? numerator / denominator : 0;
        
        // Consider seasonal if autocorrelation is above threshold
        return Math.abs(autocorrelation) > 0.3;
    }

    // ========================================================================
    // RETURN API
    // ========================================================================

    return {
        // Core statistical functions
        calculateSummary,
        detectOutliers,
        assessDataQuality,
        
        // Advanced analysis
        analyzeVariance,
        analyzeTrend,
        
        // Data search and optimization
        createBisector,
        createSearch,
        
        // Utility functions
        calculateMovingAverage,
        calculateExponentialSmoothing,
        detectSeasonality
    };
}

// ============================================================================
// WATERFALL-SPECIFIC STATISTICAL UTILITIES
// ============================================================================

/**
 * Analyze waterfall chart statistical patterns
 * Provides insights specific to waterfall financial data
 */
export function analyzeWaterfallStatistics(
    data: Array<{label: string, value: number}>,
    options: { includeTotal?: boolean, currency?: boolean } = {}
): {
    summary: StatisticalSummary,
    variance: VarianceAnalysis,
    quality: DataQualityAssessment,
    insights: string[]
} {
    const stats = createStatisticalSystem();
    const values = data.map(d => d.value);
    
    // Calculate core statistics
    const summary = stats.calculateSummary(values);
    const variance = stats.analyzeVariance(data);
    const quality = stats.assessDataQuality(values, {
        expectedRange: options.currency ? [-1000000, 1000000] : undefined
    });

    // Generate business insights
    const insights: string[] = [];
    
    if (variance.significantFactors.length > 0) {
        const topFactor = variance.significantFactors[0];
        insights.push(`${topFactor.label} is the primary driver of variance (${topFactor.impact} impact)`);
    }
    
    if (summary.standardDeviation > Math.abs(summary.mean)) {
        insights.push('High volatility detected - consider risk management strategies');
    }
    
    const positiveCount = values.filter(v => v > 0).length;
    const negativeCount = values.filter(v => v < 0).length;
    const ratio = positiveCount / negativeCount;
    
    if (ratio > 2) {
        insights.push('Predominantly positive contributors - strong growth pattern');
    } else if (ratio < 0.5) {
        insights.push('Predominantly negative contributors - potential cost management focus needed');
    }

    if (quality.anomalies.summary.outlierPercentage > 10) {
        insights.push(`${quality.anomalies.summary.totalOutliers} outliers detected - data validation recommended`);
    }

    return {
        summary,
        variance,
        quality,
        insights
    };
}

// Default export for convenience
export default createStatisticalSystem;
