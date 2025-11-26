import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import KpiCard from './KpiCard';
import ProfileItem from './ProfileItem'; // --- NEW ---
import {
  MaternalWeightChart,
  FetalGrowthChart,
  HemoglobinChart,
  BloodPressureChart
} from './charts/MaternityCharts';
import { ICONS } from '../constants';
import type { KpiData } from '../types';

// ... (Keep the Patient and DashboardData interfaces exactly as we defined them in the previous step)
// It should include the `patientProfile` object
interface Patient {
  PATIENT_ID: string;
  PATIENT_NAME: string;
}

interface DashboardData {
  kpiData: {
    MATERNAL_WEIGHT?: number;
    FUNDAL_HEIGHT?: number;
    HEMOGLOBIN_LEVEL?: number;
    BLOOD_PRESSURE?: string;
    GESTATIONAL_AGE_WEEKS?: number;
  };
  deliveryData: {
    DELIVERY_DATE?: string;
    DELIVERY_MODE?: string;
    MOTHER_CONDITION_POST_DELIVERY?: string;
    GESTATIONAL_AGE_AT_DELIVERY?: number;
  };
  visitCounts: {
    VISIT_COUNT: number;
    VACCINATED_COUNT: number;
  };
  charts: {
    maternalWeight: any[];
    fundalHeight: any[];
    hemoglobin: any[];
    bloodPressure: any[];
  };
  babyData: {
    BIRTH_WEIGHT?: number;
    DISCHARGE_DATE?: string;
    SOURCE_SCHEMA?: string;
  };
  patientProfile: {
    DATE_OF_BIRTH?: string;
    BLOOD_TYPE?: string;
    MEDICAL_HISTORY?: string;
    BMI_STATUS?: string;
  };
}

// --- NEW (for Suggestion #5) ---
type ChartTab = 'weight' | 'growth' | 'hb' | 'bp';

// --- NEW (for Suggestion #1) ---
// A simple reusable card component for grouping
const GroupCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-card shadow-sm rounded-lg border border-border">
    <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">
      {title}
    </h3>
    <div className="p-4 space-y-2">
      {children}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NEW (for Suggestion #5) ---
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>('weight');

  // ... (Keep the useEffect for fetchPatients exactly as it is) ...
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('https://healthgestbackend-na12.onrender.com/api/patients');
        const data: Patient[] = await response.json();
        setPatients(data);
        if (data.length > 0) setSelectedPatient(data[0].PATIENT_ID);
      } catch (err) {
        console.error(err);
        setError('Could not load patient list.');
      }
    };
    fetchPatients();
  }, []);

  // ... (Keep the useEffect for fetchDashboardData exactly as it is) ...
  useEffect(() => {
    if (!selectedPatient) return;
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://healthgestbackend-na12.onrender.com/api/dashboard?patientId=${selectedPatient}`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data: DashboardData = await response.json();
        setDashboardData(data);
        console.log(data);
      } catch (err) {
        console.error(err);
        setError('Could not load dashboard data for this patient.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedPatient]);

  // ... (Keep the patientOptions and PatientSelector component exactly as it is) ...
  const patientOptions = patients.map(p => ({
    value: p.PATIENT_ID,
    label: `${p.PATIENT_NAME} (ID: ${p.PATIENT_ID})`
  }));

  const PatientSelector = () => (
    <div className="mb-4 bg-card p-4 rounded-lg shadow">
      <label htmlFor="patient-select" className={`block text-sm font-medium text-text-secondary mb-1 ${isLoading ? 'opacity-50' : ''}`}>
        Select Patient
      </label>
      <Select
        inputId="patient-select"
        options={patientOptions}
        value={patientOptions.find(option => option.value === selectedPatient)}
        onChange={option => option && setSelectedPatient(option.value)}
        isSearchable
        isLoading={isLoading}
        isDisabled={isLoading}
        placeholder="Search patient name or ID..."
        styles={{
          control: base => ({ ...base, borderColor: 'rgb(209 213 219)', opacity: isLoading ? 0.5 : 1 }),
          menu: base => ({ ...base, zIndex: 20 })
        }}
      />
    </div>
  );


  // --- HEAVILY UPDATED (Suggestions 1, 2, 3, 4, 5, 6) ---
  const renderDashboardContent = () => {
    if (isLoading) return <div className="text-center p-8">Loading Dashboard...</div>;
    if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
    if (!dashboardData) return <div className="text-center p-8">Loading patient data...</div>;

    const { kpiData, deliveryData, visitCounts, charts, babyData, patientProfile } = dashboardData;

    // ... (Keep all the data formatting and change calculation logic exactly as it is) ...
    // --- Define all KPI data first ---
    type ChangeType = 'increase' | 'decrease' | 'stable';
    interface ChangeResult { change: string; changeType: ChangeType; }
    const calculateChange = (dataArray: any[], key: string, unit: string): ChangeResult => {
      if (!dataArray || dataArray.length < 2) return { change: '', changeType: 'stable' };
      const last = dataArray.length - 1;
      const current = dataArray[last]?.[key];
      const previous = dataArray[last - 1]?.[key];
      if (typeof current !== 'number' || typeof previous !== 'number') return { change: '', changeType: 'stable' };
      const diff = current - previous;
      if (Math.abs(diff) <= 0.1) return { change: '', changeType: 'stable' };
      return { change: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${unit}`, changeType: diff > 0 ? 'increase' : 'decrease' };
    };
    const calculateBPChange = (dataArray: any[], key: string): ChangeResult => {
      if (!dataArray || dataArray.length < 2) return { change: '', changeType: 'stable' };
      const last = dataArray.length - 1;
      const current = dataArray[last]?.[key];
      const previous = dataArray[last - 1]?.[key];
      if (typeof current !== 'string' || typeof previous !== 'string') return { change: '', changeType: 'stable' };
      const currSys = parseInt(current.split('/')[0]);
      const prevSys = parseInt(previous.split('/')[0]);
      if (isNaN(currSys) || isNaN(prevSys)) return { change: '', changeType: 'stable' };
      const diff = currSys - prevSys;
      if (diff === 0) return { change: '', changeType: 'stable' };
      return { change: `${diff > 0 ? '+' : ''}${diff} (sys)`, changeType: diff > 0 ? 'increase' : 'decrease' };
    };

    const weightChange = calculateChange(charts.maternalWeight, 'MATERNAL_WEIGHT', 'kg');
    const fundalChange = calculateChange(charts.fundalHeight, 'FUNDAL_HEIGHT', 'cm');
    const hbChange = calculateChange(charts.hemoglobin, 'HEMOGLOBIN_LEVEL', 'g/dL');
    const bpChange = calculateBPChange(charts.bloodPressure, 'BLOOD_PRESSURE');

    const formattedDeliveryDate = deliveryData.DELIVERY_DATE ? new Date(deliveryData.DELIVERY_DATE).toLocaleDateString() : 'N/A';
    const formattedDischargeDate = babyData?.DISCHARGE_DATE ? new Date(babyData.DISCHARGE_DATE).toLocaleDateString() : 'N/A';
    const formattedDOB = patientProfile?.DATE_OF_BIRTH ? new Date(patientProfile.DATE_OF_BIRTH).toLocaleDateString() : 'N/A';
    const birthWeight = babyData?.BIRTH_WEIGHT ? (babyData.BIRTH_WEIGHT / 1000).toFixed(1) : 'N/A';
    const weightUnit = babyData?.BIRTH_WEIGHT ? 'kg' : '';
    const ageAtDelivery = deliveryData.GESTATIONAL_AGE_AT_DELIVERY ? deliveryData.GESTATIONAL_AGE_AT_DELIVERY.toFixed(1) : 'N/A';

    // --- Define data for Chart KPIs ---
    const weightKpi: KpiData = { title: 'Last Maternal Weight', value: kpiData.MATERNAL_WEIGHT?.toString() || 'N/A', unit: 'kg', change: weightChange.change, changeType: weightChange.changeType, icon: ICONS.weight };
    const fundalKpi: KpiData = { title: 'Last Fundal Height', value: kpiData.FUNDAL_HEIGHT?.toString() || 'N/A', unit: 'cm', change: fundalChange.change, changeType: fundalChange.changeType, icon: ICONS.ruler };
    const hbKpi: KpiData = { title: 'Last HB Level', value: kpiData.HEMOGLOBIN_LEVEL?.toString() || 'N/A', unit: 'g/dL', change: hbChange.change, changeType: hbChange.changeType, icon: ICONS.heart };
    const bpKpi: KpiData = { title: 'Last BP Level', value: kpiData.BLOOD_PRESSURE || 'N/A', unit: '', change: bpChange.change, changeType: bpChange.changeType, icon: ICONS.heart };

    // --- Define data for Highlighted KPIs (Suggestion #3) ---
    const visitKpi: KpiData = { title: 'Visit Count', value: visitCounts.VISIT_COUNT.toString(), unit: '', change: '', changeType: 'stable', icon: ICONS.ruler };
    const conditionKpi: KpiData = { title: 'Mother Condition', value: deliveryData.MOTHER_CONDITION_POST_DELIVERY || 'N/A', unit: '', change: '', changeType: 'stable', icon: ICONS.heart };

    // --- Logic for Suggestion #6 (Status Color) ---
    const getConditionStatus = () => {
      const condition = deliveryData.MOTHER_CONDITION_POST_DELIVERY?.toLowerCase();
      if (condition === 'stable') return 'positive';
      if (condition === 'unstable' || condition === 'critical') return 'critical';
      return 'stable';
    };

    // --- NEW (for Suggestion #5) ---
    const ChartTabs = () => {
      const tabs: { key: ChartTab, label: string }[] = [
        { key: 'weight', label: 'Maternal Weight' },
        { key: 'growth', label: 'Fetal Growth' },
        { key: 'hb', label: 'Hemoglobin' },
        { key: 'bp', label: 'Blood Pressure' },
      ];

      return (
        <div className="border-b border-border mb-4">
          <nav className="-mb-px flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveChartTab(tab.key)}
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm
                  ${activeChartTab === tab.key
                    ? 'border-primary-dark text-primary-dark'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* --- Row 1: Highlighted KPIs (Suggestion #3 & #6) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <KpiCard data={visitKpi} isHighlighted={true} />
          <KpiCard data={conditionKpi} status={getConditionStatus()} />
        </div>

        {/* --- Row 2: Grouped Profile & Delivery (Suggestion #1, #2, #4) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GroupCard title="Patient Profile">
            <ProfileItem icon={ICONS.baby} label="Date of Birth" value={formattedDOB} />
            <ProfileItem icon={ICONS.heart} label="Blood Type" value={patientProfile?.BLOOD_TYPE} />
            <ProfileItem icon={ICONS.weight} label="BMI Status" value={patientProfile?.BMI_STATUS} />
            <ProfileItem
              icon={ICONS.heart}
              label="Medical History"
              value={patientProfile?.MEDICAL_HISTORY}
              tooltip={patientProfile?.MEDICAL_HISTORY} // --- Suggestion #4 ---
            />
          </GroupCard>

          <GroupCard title="Delivery & Baby Info">
            <ProfileItem icon={ICONS.baby} label="Delivery Mode" value={deliveryData.DELIVERY_MODE} />
            <ProfileItem icon={ICONS.baby} label="Gestational Age at Delivery" value={`${ageAtDelivery} weeks`} />
            <ProfileItem icon={ICONS.baby} label="Baby Birth Weight" value={`${birthWeight} ${weightUnit}`} />
            <ProfileItem icon={ICONS.baby} label="Term Status" value={babyData?.SOURCE_SCHEMA} />
          </GroupCard>
        </div>

        {/* --- Row 3: Grouped Visit & Dates (Suggestion #1 & #2) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GroupCard title="Visit & Condition Summary">
            <ProfileItem icon={ICONS.ruler} label="Vaccinated Count" value={visitCounts.VACCINATED_COUNT.toString()} />
            <ProfileItem icon={ICONS.baby} label="Last Gestational Age" value={`${kpiData.GESTATIONAL_AGE_WEEKS || 'N/A'} weeks`} />
          </GroupCard>

          <GroupCard title="Key Dates">
            <ProfileItem icon={ICONS.baby} label="Delivery Date" value={formattedDeliveryDate} />
            <ProfileItem icon={ICONS.baby} label="Discharge Date" value={formattedDischargeDate} />
          </GroupCard>
        </div>

        {/* --- Row 4: Charts (Suggestion #5) --- */}
        <div className="bg-card shadow-sm rounded-lg border border-border p-4">
          <ChartTabs />
          <div className="pt-4">
            {activeChartTab === 'weight' && <MaternalWeightChart data={charts.maternalWeight} kpiData={weightKpi} />}
            {activeChartTab === 'growth' && <FetalGrowthChart data={charts.fundalHeight} kpiData={fundalKpi} />}
            {activeChartTab === 'hb' && <HemoglobinChart data={charts.hemoglobin} kpiData={hbKpi} />}
            {activeChartTab === 'bp' && <BloodPressureChart data={charts.bloodPressure} kpiData={bpKpi} />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PatientSelector />
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;