// MintWaterfall Advanced Statistical Analysis - TypeScript Version
// Provides comprehensive statistical analysis features for waterfall chart data

import * as d3 from 'd3';
import { median, variance, deviation, quantile, bisector, ascending } from 'd3-array';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StatisticalSummary {
    count: number;
    sum: number;
    mean: number;
    median: number;
    mode: number[];
    variance: number;
    standardDeviation: number;
    min: number;
    max: number;
    range: number;
    quartiles: number[];
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
    method: string;
    threshold: any;
    statistics: {
        mean: number;
        median: number;
        q1: number;
        q3: number;
        iqr: number;
    };
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
    issues: string[];
    anomalies: OutlierAnalysis;
    recommendations: string[];
}

export interface VarianceAnalysis {
    totalVariance: number;
    positiveVariance: number;
    negativeVariance: number;
    withinGroupVariance: number;
    betweenGroupVariance: number;
    fStatistic: number;
    significance: string;
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
    intercept: number;
    correlation: number;
    rSquared: number;
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: 'strong' | 'moderate' | 'weak' | 'none';
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    projectedValues: Array<{
        period: number;
        value: number;
        x: number;
        y: number;
        confidence: { lower: number; upper: number };
    }>;
    forecast: Array<{
        period: number;
        value: number;
        x: number;
        y: number;
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
            // Return empty statistical summary instead of throwing
            return {
                count: 0,
                sum: 0,
                mean: 0,
                median: 0,
                mode: [],
                variance: 0,
                standardDeviation: 0,
                min: 0,
                max: 0,
                range: 0,
                quartiles: [0, 0, 0],
                percentiles: { p5: 0, p10: 0, p25: 0, p75: 0, p90: 0, p95: 0 }
            };
        }

        const count = cleanData.length;
        const sum = d3.sum(cleanData);
        const mean = d3.mean(cleanData) || 0;
        const medianValue = median(cleanData) || 0;
        const varianceValue = variance(cleanData) || 0;
        const standardDeviation = deviation(cleanData) || 0;
        const min = d3.min(cleanData) || 0;
        const max = d3.max(cleanData) || 0;
        const range = max - min;

        // Calculate quartiles
        const q1 = quantile(cleanData, 0.25) || 0;
        const q2 = medianValue;
        const q3 = quantile(cleanData, 0.75) || 0;
        const iqr = q3 - q1;

        // Calculate percentiles
        const percentiles = {
            p5: quantile(cleanData, 0.05) || 0,
            p10: quantile(cleanData, 0.10) || 0,
            p25: q1,
            p75: q3,
            p90: quantile(cleanData, 0.90) || 0,
            p95: quantile(cleanData, 0.95) || 0
        };

        // Calculate mode (most frequent value)
        const valueFreq = new Map<number, number>();
        cleanData.forEach(value => {
            valueFreq.set(value, (valueFreq.get(value) || 0) + 1);
        });
        
        let maxFreq = 0;
        const modes: number[] = [];
        valueFreq.forEach((freq, value) => {
            if (freq > maxFreq) {
                maxFreq = freq;
                modes.length = 0;
                modes.push(value);
            } else if (freq === maxFreq) {
                modes.push(value);
            }
        });

        return {
            count,
            sum,
            mean,
            median: medianValue,
            mode: modes,
            variance: varianceValue,
            standardDeviation,
            min,
            max,
            range,
            quartiles: [q1, q2, q3],
            percentiles
        };
    }

    /**
     * Detect outliers using IQR method and modified Z-score
     * Enhanced with severity classification
     */
    function detectOutliers(data: number[], labels: string[] = []): OutlierAnalysis {
        const summary = calculateSummary(data);
        const [q1, q2, q3] = summary.quartiles;
        const iqr = q3 - q1;
        
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
            method: 'iqr',
            threshold: { lowerBound, upperBound, extremeLowerBound, extremeUpperBound },
            statistics: {
                mean: summary.mean,
                median: summary.median,
                q1,
                q3,
                iqr
            },
            summary: {
                totalOutliers: outliers.length,
                mildOutliers,
                extremeOutliers,
                outlierPercentage: data.length > 0 ? (outliers.length / data.length) * 100 : 0
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
            if (item == null || (item && item.value == null)) {
                nullCount++;
                return;
            }

            validCount++;

            // Check data type (check the value property if it exists, otherwise the item itself)
            const valueToCheck = item && typeof item === 'object' && 'value' in item ? item.value : item;
            const itemType = typeof valueToCheck;
            if (allowedTypes.includes(itemType)) {
                typeValidCount++;
            }

            // Check range (for numbers)
            if (itemType === 'number' && expectedRange) {
                if (valueToCheck >= expectedRange[0] && valueToCheck <= expectedRange[1]) {
                    rangeValidCount++;
                }
            } else if (!expectedRange) {
                rangeValidCount++; // No range constraint
            }

            // Check duplicates
            const itemStr = JSON.stringify(valueToCheck);
            if (seen.has(itemStr)) {
                duplicates.add(itemStr);
            } else {
                seen.add(itemStr);
            }
        });

        // Calculate quality metrics
        const completeness = (totalCount - nullCount) / totalCount;
        const validity = typeValidCount / totalCount;
        const accuracy = rangeValidCount / totalCount;
        
        // Consistency (coefficient of variation for numeric data)
        const numericData = data.filter(d => typeof d === 'number' && !isNaN(d));
        const cv = numericData.length > 0 ? 
            (deviation(numericData) || 0) / (d3.mean(numericData) || 1) : 0;
        const consistency = Math.max(0, 100 - (cv * 100)); // Invert CV for consistency score

        // Outlier analysis for numeric data
        const anomalies = numericData.length > 0 ? 
            detectOutliers(numericData) : 
            { 
                outliers: [], 
                cleanData: [], 
                method: 'None - No numeric data',
                threshold: {},
                statistics: { mean: 0, median: 0, q1: 0, q3: 0, iqr: 0 },
                summary: { totalOutliers: 0, mildOutliers: 0, extremeOutliers: 0, outlierPercentage: 0 } 
            };

        // Generate recommendations
        const recommendations: string[] = [];
        if (completeness < (1 - nullTolerance)) {
            recommendations.push(`Improve data completeness: ${nullCount} missing values detected`);
            recommendations.push('Remove or impute missing values');
        }
        if (validity < 0.95) {
            recommendations.push(`Validate data types: ${totalCount - typeValidCount} invalid types found`);
        }
        if (accuracy < 0.90 && expectedRange) {
            recommendations.push(`Check data accuracy: ${totalCount - rangeValidCount} values outside expected range`);
        }
        if (duplicates.size > duplicateTolerance * totalCount) {
            recommendations.push(`Remove duplicates: ${duplicates.size} duplicate values detected`);
        }
        if (anomalies.summary.outlierPercentage > 5) {
            recommendations.push(`Investigate outliers: ${anomalies.summary.totalOutliers} outliers detected (${anomalies.summary.outlierPercentage.toFixed(1)}%)`);
        }

        // Generate issues list
        const issues: string[] = [];
        if (nullCount > 0) {
            issues.push(`${nullCount} null or missing values found`);
        }
        if (totalCount - typeValidCount > 0) {
            issues.push(`${totalCount - typeValidCount} invalid data types found`);
        }
        if (expectedRange && totalCount - rangeValidCount > 0) {
            issues.push(`${totalCount - rangeValidCount} values outside expected range`);
        }
        if (duplicates.size > 0) {
            issues.push(`${duplicates.size} duplicate values found`);
        }
        if (anomalies.summary.totalOutliers > 0) {
            issues.push(`${anomalies.summary.totalOutliers} outliers detected`);
        }

        return {
            completeness,
            consistency,
            accuracy,
            validity,
            duplicates: duplicates.size,
            issues,
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
        const totalVariance = variance(values) || 0;
        
        // Separate positive and negative contributions
        const positiveValues = values.filter(v => v > 0);
        const negativeValues = values.filter(v => v < 0);
        
        const positiveVariance = positiveValues.length > 0 ? (variance(positiveValues) || 0) : 0;
        const negativeVariance = negativeValues.length > 0 ? (variance(negativeValues) || 0) : 0;

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

        // Calculate additional statistical measures for ANOVA-style analysis
        const groupMean = d3.mean(values) || 0;
        
        // Group data by categories (try to extract category from label, fallback to positive/negative)
        const categoryGroups = new Map();
        data.forEach(item => {
            // Try to extract category from label (e.g., "A1" -> "A", "Category1" -> "Category")
            const category = item.label.match(/^([A-Za-z]+)/)?.[1] || 
                           (item.value > 0 ? 'positive' : 'negative');
            
            if (!categoryGroups.has(category)) {
                categoryGroups.set(category, []);
            }
            categoryGroups.get(category).push(item.value);
        });
        
        const groups = Array.from(categoryGroups.entries()).map(([name, values]) => ({
            name, values
        })).filter(g => g.values.length > 0);
        
        // Calculate between-group variance
        let betweenGroupVariance = 0;
        if (groups.length > 1) {
            const groupMeans = groups.map(g => d3.mean(g.values) || 0);
            const groupSizes = groups.map(g => g.values.length);
            const totalSize = values.length;
            
            betweenGroupVariance = groups.reduce((sum, group, i) => {
                const groupMeanValue = groupMeans[i];
                const groupSize = groupSizes[i];
                return sum + (groupSize * Math.pow(groupMeanValue - groupMean, 2));
            }, 0) / (groups.length - 1);
        }
        
        // Within-group variance
        const withinGroupVariance = groups.length > 0 ? 
            groups.reduce((sum, group) => {
                const groupVar = variance(group.values) || 0;
                return sum + (groupVar * (group.values.length - 1));
            }, 0) / Math.max(1, values.length - groups.length) : totalVariance;
        
        // F-statistic for variance analysis
        const fStatistic = betweenGroupVariance > 0 && withinGroupVariance > 0 ? 
            betweenGroupVariance / withinGroupVariance : 0;
        
        // Significance level (simplified p-value approximation)
        const significance = fStatistic > 4 ? 'significant' : 
                           fStatistic > 2 ? 'moderate' : 'not significant';

        return {
            totalVariance,
            positiveVariance,
            negativeVariance,
            withinGroupVariance,
            betweenGroupVariance,
            fStatistic,
            significance,
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
            // Return empty trend analysis instead of throwing
            return {
                slope: 0,
                intercept: 0,
                correlation: 0,
                rSquared: 0,
                direction: 'stable',
                strength: 'none',
                confidence: 0,
                trend: 'stable',
                projectedValues: [],
                forecast: []
            };
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
        const xStd = deviation(xValues) || 0;
        const yStd = deviation(yValues) || 0;
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
            const standardError = Math.sqrt(variance(yValues) || 0) / Math.sqrt(data.length);
            
            return {
                period,
                value,
                x: period, // alias for backward compatibility
                y: value,  // alias for backward compatibility
                confidence: {
                    lower: value - (1.96 * standardError),
                    upper: value + (1.96 * standardError)
                }
            };
        });

        // Calculate intercept and R-squared
        const intercept = yMean - slope * xMean;
        const rSquared = correlation * correlation;

        return {
            slope,
            intercept,
            correlation,
            rSquared,
            direction,
            strength,
            confidence,
            trend: direction, // alias for backward compatibility
            projectedValues,
            forecast: projectedValues // alias for backward compatibility
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
        return bisector(accessor);
    }

    /**
     * Create fast search function for sorted data
     * Returns the closest data point to a given value
     */
    function createSearch<T>(data: T[], accessor: (d: T) => number): (value: number) => T | undefined {
        const bisector = createBisector(accessor);
        const sortedData = [...data].sort((a, b) => ascending(accessor(a), accessor(b)));
        
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
        if (window <= 0 || window > data.length || data.length === 0) {
            return []; // Return empty array instead of throwing
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
        if (alpha < 0 || alpha > 1 || data.length === 0) {
            return []; // Return empty array instead of throwing
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
