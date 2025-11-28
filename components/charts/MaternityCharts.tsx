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

// Helper function to ensure prediction connects with actual data
const createSeamlessDataset = (mainData: any[], averageData: any[], predictionData: any[]) => {
  if (!mainData || mainData.length === 0) return [];
  
  // Find the last actual data point
  const lastActualData = mainData[mainData.length - 1];
  const lastActualWeek = lastActualData?.GESTATIONAL_AGE_WEEKS;
  
  // Find the maximum week from all data sources
  const allWeeks = [
    ...mainData.map(item => item.GESTATIONAL_AGE_WEEKS),
    ...(averageData || []).map(item => item.GESTATIONAL_AGE_WEEKS),
    ...(predictionData || []).map(item => item.GESTATIONAL_AGE_WEEKS)
  ].filter(week => week != null);
  
  const maxWeek = Math.max(...allWeeks, 40);
  const minWeek = 2;
  
  // Create week array from minWeek to maxWeek
  const weeks = Array.from({ length: maxWeek - minWeek + 1 }, (_, i) => minWeek + i);
  
  // Create data maps for quick lookup
  const mainDataMap = new Map(mainData.map(item => [item.GESTATIONAL_AGE_WEEKS, item]));
  const averageDataMap = new Map((averageData || []).map(item => [item.GESTATIONAL_AGE_WEEKS, item]));
  const predictionDataMap = new Map((predictionData || []).map(item => [item.GESTATIONAL_AGE_WEEKS, item]));
  
  // Build complete dataset
  return weeks.map(week => {
    const mainItem = mainDataMap.get(week) || {};
    const avgItem = averageDataMap.get(week) || {};
    const predItem = predictionDataMap.get(week) || {};
    
    // If this is the last actual week, ensure prediction starts from here
    let predictedWeight = predItem.PREDICTED_WEIGHT;
    let predictedFundalHeight = predItem.PREDICTED_FUNDAL_HEIGHT;
    let predictedHemoglobin = predItem.PREDICTED_HEMOGLOBIN_LEVEL;
    let predictedSystolic = predItem.PREDICTED_BP_SYSTOLIC;
    let predictedDiastolic = predItem.PREDICTED_BP_DIASTOLIC;
    
    // If this is the last actual data week, use actual values as starting point for predictions
    if (week === lastActualWeek) {
      predictedWeight = mainItem.MATERNAL_WEIGHT || predictedWeight;
      predictedFundalHeight = mainItem.FUNDAL_HEIGHT || predictedFundalHeight;
      predictedHemoglobin = mainItem.HEMOGLOBIN_LEVEL || predictedHemoglobin;
      predictedSystolic = mainItem.BP_SYSTOLIC || predictedSystolic;
      predictedDiastolic = mainItem.BP_DIASTOLIC || predictedDiastolic;
    }
    
    return {
      GESTATIONAL_AGE_WEEKS: week,
      // Main data
      MATERNAL_WEIGHT: mainItem.MATERNAL_WEIGHT,
      FUNDAL_HEIGHT: mainItem.FUNDAL_HEIGHT,
      HEMOGLOBIN_LEVEL: mainItem.HEMOGLOBIN_LEVEL,
      BP_SYSTOLIC: mainItem.BP_SYSTOLIC,
      BP_DIASTOLIC: mainItem.BP_DIASTOLIC,
      // Average data
      AVG_WEIGHT: avgItem.AVG_WEIGHT,
      AVG_FUNDAL: avgItem.AVG_FUNDAL,
      AVG_HB: avgItem.AVG_HB,
      AVG_SYSTOLIC: avgItem.AVG_SYSTOLIC,
      AVG_DIASTOLIC: avgItem.AVG_DIASTOLIC,
      // Prediction data - ensuring seamless connection
      PREDICTED_WEIGHT: predictedWeight,
      PREDICTED_FUNDAL_HEIGHT: predictedFundalHeight,
      PREDICTED_HEMOGLOBIN_LEVEL: predictedHemoglobin,
      PREDICTED_BP_SYSTOLIC: predictedSystolic,
      PREDICTED_BP_DIASTOLIC: predictedDiastolic
    };
  });
};

// Helper function to calculate Y-axis domain with clean numbers
const calculateDomain = (data: any[], keys: string[]) => {
  if (!data || data.length === 0) return [0, 100];
  
  const allValues = data.flatMap(item => 
    keys.map(key => item[key]).filter(val => val != null)
  );
  
  if (allValues.length === 0) return [0, 100];
  
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  
  const padding = (max - min) * 0.1;
  
  // Round to nice numbers for Y-axis
  const roundedMin = Math.floor(Math.max(0, min - padding));
  const roundedMax = Math.ceil(max + padding);
  
  return [roundedMin, roundedMax];
};

// Helper function to format tooltip values
const formatTooltipValue = (value: number, unit: string) => {
  if (value == null) return 'No data';
  return `${Math.round(value)} ${unit}`;
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
  const seamlessData = useMemo(() => 
    createSeamlessDataset(data, averageData, data),
    [data, averageData]
  );
  
  const domain = useMemo(() => 
    calculateDomain(seamlessData, ['MATERNAL_WEIGHT', 'PREDICTED_WEIGHT', 'AVG_WEIGHT']),
    [seamlessData]
  );
  
  return (
    <ChartWrapper kpi={kpiData}>
      <AreaChart data={seamlessData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="GESTATIONAL_AGE_WEEKS"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}w`}
          domain={[2, 'dataMax']}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${Math.round(val)}`} // Clean numbers only
          domain={domain}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            return [formatTooltipValue(value, 'kg'), name];
          }}
          labelFormatter={(label) => `Week ${label}`}
        />
        <Legend />

        {/* Prediction Data (Area) */}
        <Area
          type="monotone"
          dataKey="PREDICTED_WEIGHT"
          stroke={COLORS.PREDICTION_LINE}
          fill={COLORS.PREDICTION_FILL}
          fillOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Predicted Weight"
          dot={{ r: 3, stroke: COLORS.PREDICTION_LINE, strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 5 }}
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
  const seamlessData = useMemo(() => 
    createSeamlessDataset(data, averageData, data),
    [data, averageData]
  );
  
  const domain = useMemo(() => 
    calculateDomain(seamlessData, ['FUNDAL_HEIGHT', 'PREDICTED_FUNDAL_HEIGHT', 'AVG_FUNDAL']),
    [seamlessData]
  );
  
  return (
    <ChartWrapper kpi={kpiData}>
      <AreaChart data={seamlessData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="GESTATIONAL_AGE_WEEKS"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}w`}
          domain={[2, 'dataMax']}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${Math.round(val)}`} // Clean numbers only
          domain={domain}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            return [formatTooltipValue(value, 'cm'), name];
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
          dot={{ r: 3, stroke: COLORS.PREDICTION_LINE, strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 5 }}
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
  const seamlessData = useMemo(() => 
    createSeamlessDataset(data, averageData, data),
    [data, averageData]
  );
  
  const domain = useMemo(() => 
    calculateDomain(seamlessData, ['HEMOGLOBIN_LEVEL', 'PREDICTED_HEMOGLOBIN_LEVEL', 'AVG_HB']),
    [seamlessData]
  );
  
  return (
    <ChartWrapper kpi={kpiData}>
      <AreaChart data={seamlessData} margin={{ top: 50, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="GESTATIONAL_AGE_WEEKS"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}w`}
          domain={[2, 'dataMax']}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${Math.round(val)}`} // Clean numbers only
          domain={domain}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            return [formatTooltipValue(value, 'g/dL'), name];
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
          dot={{ r: 3, stroke: COLORS.PREDICTION_LINE, strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 5 }}
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
  const seamlessData = useMemo(() => 
    createSeamlessDataset(data, averageData, data),
    [data, averageData]
  );
  
  const domain = useMemo(() => 
    calculateDomain(seamlessData, [
      'BP_SYSTOLIC', 'BP_DIASTOLIC', 
      'PREDICTED_BP_SYSTOLIC', 'PREDICTED_BP_DIASTOLIC',
      'AVG_SYSTOLIC', 'AVG_DIASTOLIC'
    ]),
    [seamlessData]
  );
  
  return (
    <ChartWrapper kpi={kpiData}>
      <AreaChart data={seamlessData} margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="GESTATIONAL_AGE_WEEKS"
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${val}w`}
          domain={[2, 'dataMax']}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(val) => `${Math.round(val)}`} // Clean numbers only
          domain={domain}
        />
        <Tooltip 
          formatter={(value: number, name: string) => {
            return [formatTooltipValue(value, 'mmHg'), name];
          }}
          labelFormatter={(label) => `Week ${label}`}
        />
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
          dot={{ r: 3, stroke: "#dc2626", strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 5 }}
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
          dot={{ r: 3, stroke: "#8b5cf6", strokeWidth: 2, fill: 'white' }}
          activeDot={{ r: 5 }}
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