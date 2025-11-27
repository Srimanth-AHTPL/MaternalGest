// components/charts/MaternityCharts.tsx
import React, { ReactNode, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { KpiData } from '../../types.ts';
import { DashboardKpiCard } from '../SharedComponents.tsx';

// Updated Color constants
const COLORS = {
  ACTUAL_LINE: '#2563eb',      // Blue for actual line
  ACTUAL_FILL: '#60a5fa',      // Lighter blue for actual fill
  PREDICTION_LINE: '#ef4444',  // Red for prediction line
  PREDICTION_FILL: '#fca5a5',  // Light red for prediction fill
  AVERAGE: '#5A9690'           // Green for average line
};

// Helper function to merge and align all data
const mergeChartData = (mainData: any[], averageData: any[], predictionData: any[]) => {
  if (!mainData || mainData.length === 0) return [];
  
  // Create a map of all available weeks from main data
  const weekMap = new Map();
  
  // Add main data
  mainData.forEach(item => {
    if (item.GESTATIONAL_AGE_WEEKS != null) {
      weekMap.set(item.GESTATIONAL_AGE_WEEKS, {
        ...item,
        GESTATIONAL_AGE_WEEKS: item.GESTATIONAL_AGE_WEEKS
      });
    }
  });
  
  // Merge average data (ensure it matches the same weeks)
  if (averageData && averageData.length > 0) {
    averageData.forEach(avgItem => {
      const week = avgItem.GESTATIONAL_AGE_WEEKS;
      if (week != null) {
        const existing = weekMap.get(week) || { GESTATIONAL_AGE_WEEKS: week };
        weekMap.set(week, {
          ...existing,
          AVG_WEIGHT: avgItem.AVG_WEIGHT,
          AVG_FUNDAL: avgItem.AVG_FUNDAL,
          AVG_HB: avgItem.AVG_HB,
          AVG_SYSTOLIC: avgItem.AVG_SYSTOLIC,
          AVG_DIASTOLIC: avgItem.AVG_DIASTOLIC
        });
      }
    });
  }
  
  // Merge prediction data (ensure it matches the same weeks)
  if (predictionData && predictionData.length > 0) {
    predictionData.forEach(predItem => {
      const week = predItem.GESTATIONAL_AGE_WEEKS;
      if (week != null) {
        const existing = weekMap.get(week) || { GESTATIONAL_AGE_WEEKS: week };
        weekMap.set(week, {
          ...existing,
          PREDICTED_WEIGHT: predItem.PREDICTED_WEIGHT,
          PREDICTED_FUNDAL_HEIGHT: predItem.PREDICTED_FUNDAL_HEIGHT,
          PREDICTED_HEMOGLOBIN_LEVEL: predItem.PREDICTED_HEMOGLOBIN_LEVEL,
          PREDICTED_BP_SYSTOLIC: predItem.PREDICTED_BP_SYSTOLIC,
          PREDICTED_BP_DIASTOLIC: predItem.PREDICTED_BP_DIASTOLIC
        });
      }
    });
  }
  
  // Convert back to array and sort by week
  return Array.from(weekMap.values()).sort((a, b) => a.GESTATIONAL_AGE_WEEKS - b.GESTATIONAL_AGE_WEEKS);
};

// Helper function to calculate Y-axis domain
const calculateDomain = (data: any[], keys: string[]) => {
  if (!data || data.length === 0) return [0, 100];
  
  const allValues = data.flatMap(item => 
    keys.map(key => item[key]).filter(val => val != null)
  );
  
  if (allValues.length === 0) return [0, 100];
  
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  
  // Add 10% padding
  const padding = (max - min) * 0.1;
  return [Math.max(0, min - padding), max + padding];
};

// --- Base Chart Component ---
const ChartWrapper: React.FC<{ kpi: KpiData, children: ReactNode }> = ({ kpi, children }) => (
  <div>
    <DashboardKpiCard data={kpi} />
    <div className="h-80 mt-4">
      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

// --- Maternal Weight Chart ---
export const MaternalWeightChart: React.FC<{ data: any[], averageData: any[], kpiData: KpiData }> = ({ data, averageData, kpiData }) => {
  // Merge all data to ensure alignment
  const mergedData = useMemo(() => 
    mergeChartData(data, averageData, data), // Using main data for predictions too
    [data, averageData]
  );
  
  const domain = useMemo(() => 
    calculateDomain(mergedData, ['MATERNAL_WEIGHT', 'PREDICTED_WEIGHT', 'AVG_WEIGHT']),
    [mergedData]
  );
  
  return (
    <ChartWrapper kpi={kpiData}>
      <AreaChart data={mergedData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="GESTATIONAL_AGE_WEEKS"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}w`}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}kg`}
          domain={domain}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            return [`${value} kg`, name];
          }}
          labelFormatter={(label) => `Week ${label}`}
        />
        <Legend />

        {/* Prediction Data (Area - just like actual data) */}
        <Area
          type="monotone"
          dataKey="PREDICTED_WEIGHT"
          stroke={COLORS.PREDICTION_LINE}
          fill={COLORS.PREDICTION_FILL}
          fillOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Predicted Weight"
          dot={{ r: 4, stroke: COLORS.PREDICTION_LINE, strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Real Data (Area) */}
        <Area
          type="monotone"
          dataKey="MATERNAL_WEIGHT"
          stroke={COLORS.ACTUAL_LINE}
          fill={COLORS.ACTUAL_FILL}
          fillOpacity={0.6}
          strokeWidth={2}
          name="Weight (kg)"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Average Line */}
        <Area
          type="monotone"
          dataKey="AVG_WEIGHT"
          stroke={COLORS.AVERAGE}
          fill="transparent"
          strokeWidth={3}
          name="Average (BMI)"
          dot={false}
          activeDot={false}
          connectNulls={true}
        />
      </AreaChart>
    </ChartWrapper>
  );
};

// --- Fetal Growth Chart ---
export const FetalGrowthChart: React.FC<{ data: any[], averageData: any[], kpiData: KpiData }> = ({ data, averageData, kpiData }) => {
  const mergedData = useMemo(() => 
    mergeChartData(data, averageData, data),
    [data, averageData]
  );
  
  const domain = useMemo(() => 
    calculateDomain(mergedData, ['FUNDAL_HEIGHT', 'PREDICTED_FUNDAL_HEIGHT', 'AVG_FUNDAL']),
    [mergedData]
  );
  
  return (
    <ChartWrapper kpi={kpiData}>
      <AreaChart data={mergedData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="GESTATIONAL_AGE_WEEKS"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}w`}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}cm`}
          domain={domain}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            return [`${value} cm`, name];
          }}
          labelFormatter={(label) => `Week ${label}`}
        />
        <Legend />

        {/* Prediction Data (Area) */}
        <Area
          type="monotone"
          dataKey="PREDICTED_FUNDAL_HEIGHT"
          stroke={COLORS.PREDICTION_LINE}
          fill={COLORS.PREDICTION_FILL}
          fillOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Predicted Height"
          dot={{ r: 4, stroke: COLORS.PREDICTION_LINE, strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Real Data */}
        <Area
          type="monotone"
          dataKey="FUNDAL_HEIGHT"
          stroke={COLORS.ACTUAL_LINE}
          fill={COLORS.ACTUAL_FILL}
          fillOpacity={0.6}
          strokeWidth={2}
          name="Fundal Height (cm)"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Average Line */}
        <Area
          type="monotone"
          dataKey="AVG_FUNDAL"
          stroke={COLORS.AVERAGE}
          fill="transparent"
          strokeWidth={3}
          name="Average (BMI)"
          dot={false}
          activeDot={false}
          connectNulls={true}
        />
      </AreaChart>
    </ChartWrapper>
  );
};

// --- Hemoglobin Chart ---
export const HemoglobinChart: React.FC<{ data: any[], averageData: any[], kpiData: KpiData }> = ({ data, averageData, kpiData }) => {
  const mergedData = useMemo(() => 
    mergeChartData(data, averageData, data),
    [data, averageData]
  );
  
  const domain = useMemo(() => 
    calculateDomain(mergedData, ['HEMOGLOBIN_LEVEL', 'PREDICTED_HEMOGLOBIN_LEVEL', 'AVG_HB']),
    [mergedData]
  );
  
  return (
    <ChartWrapper kpi={kpiData}>
      <AreaChart data={mergedData} margin={{ top: 50, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="GESTATIONAL_AGE_WEEKS"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}w`}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val} g/dL`}
          domain={domain}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            return [`${value} g/dL`, name];
          }}
          labelFormatter={(label) => `Week ${label}`}
        />
        <Legend />

        {/* Prediction Data (Area) */}
        <Area
          type="monotone"
          dataKey="PREDICTED_HEMOGLOBIN_LEVEL"
          stroke={COLORS.PREDICTION_LINE}
          fill={COLORS.PREDICTION_FILL}
          fillOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Predicted Hb"
          dot={{ r: 4, stroke: COLORS.PREDICTION_LINE, strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Real Data */}
        <Area
          type="monotone"
          dataKey="HEMOGLOBIN_LEVEL"
          stroke={COLORS.ACTUAL_LINE}
          fill={COLORS.ACTUAL_FILL}
          fillOpacity={0.6}
          strokeWidth={2}
          name="Hb Level (g/dL)"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Average Line */}
        <Area
          type="monotone"
          dataKey="AVG_HB"
          stroke={COLORS.AVERAGE}
          fill="transparent"
          strokeWidth={3}
          name="Average (BMI)"
          dot={false}
          activeDot={false}
          connectNulls={true}
        />
      </AreaChart>
    </ChartWrapper>
  );
};

// --- Blood Pressure Chart ---
export const BloodPressureChart: React.FC<{ data: any[], averageData: any[], kpiData: KpiData }> = ({ data, averageData, kpiData }) => {
  const mergedData = useMemo(() => 
    mergeChartData(data, averageData, data),
    [data, averageData]
  );
  
  const domain = useMemo(() => 
    calculateDomain(mergedData, [
      'BP_SYSTOLIC', 'BP_DIASTOLIC', 
      'PREDICTED_BP_SYSTOLIC', 'PREDICTED_BP_DIASTOLIC',
      'AVG_SYSTOLIC', 'AVG_DIASTOLIC'
    ]),
    [mergedData]
  );
  
  return (
    <ChartWrapper kpi={kpiData}>
      <AreaChart data={mergedData} margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="GESTATIONAL_AGE_WEEKS"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}w`}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val} mmHg`}
          domain={domain}
        />
        <Tooltip labelFormatter={(label) => `Week ${label}`} />
        <Legend />

        {/* Prediction Data - Systolic (Area) */}
        <Area
          type="monotone"
          dataKey="PREDICTED_BP_SYSTOLIC"
          stroke="#dc2626"
          fill="#fecaca"
          fillOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Predicted Systolic"
          dot={{ r: 4, stroke: "#dc2626", strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Prediction Data - Diastolic (Area) */}
        <Area
          type="monotone"
          dataKey="PREDICTED_BP_DIASTOLIC"
          stroke="#8b5cf6"
          fill="#ddd6fe"
          fillOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Predicted Diastolic"
          dot={{ r: 4, stroke: "#8b5cf6", strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Real Data - Systolic */}
        <Area
          type="monotone"
          dataKey="BP_SYSTOLIC"
          stroke={COLORS.ACTUAL_LINE}
          fill={COLORS.ACTUAL_FILL}
          fillOpacity={0.6}
          strokeWidth={2}
          name="Systolic (mmHg)"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Real Data - Diastolic */}
        <Area
          type="monotone"
          dataKey="BP_DIASTOLIC"
          stroke="#7c3aed"
          fill="#c4b5fd"
          fillOpacity={0.6}
          strokeWidth={2}
          name="Diastolic (mmHg)"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />

        {/* Average Lines */}
        <Area
          type="monotone"
          dataKey="AVG_SYSTOLIC"
          stroke={COLORS.AVERAGE}
          fill="transparent"
          strokeWidth={3}
          name="Average Systolic (BMI)"
          dot={false}
          activeDot={false}
          connectNulls={true}
        />
        <Area
          type="monotone"
          dataKey="AVG_DIASTOLIC"
          stroke={COLORS.AVERAGE}
          fill="transparent"
          strokeWidth={3}
          name="Average Diastolic (BMI)"
          dot={false}
          activeDot={false}
          connectNulls={true}
        />
      </AreaChart>
    </ChartWrapper>
  );
};