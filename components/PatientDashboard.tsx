// components/PatientDashboard.tsx
import React, { useState, useEffect, ReactNode } from 'react';
import { ICONS } from '../constants.tsx';
import type { Patient, DashboardData, ChartTab, KpiData, KpiStatus } from '../types.ts';
import { DashboardKpiCard, ProfileItem, GroupCard } from './SharedComponents.tsx';
import { ProbabilityBars } from './ProbabilityBars.tsx';
import {
    MaternalWeightChart,
    FetalGrowthChart,
    HemoglobinChart,
    BloodPressureChart
} from './charts/MaternityCharts.tsx';
import { AIPInsightCard } from './AIPInsightCard.tsx';


// --- PROPS INTERFACE ---
interface PatientDashboardProps {
    patientListEndpoint: string;
    dashboardApiEndpoint: string;
    selectorLabel: string;
    noPatientsMessage: string;
    isOngoing: boolean;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
    patientListEndpoint,
    dashboardApiEndpoint,
    selectorLabel,
    noPatientsMessage,
    isOngoing
}) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string>('');
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPatientListLoading, setIsPatientListLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeChartTab, setActiveChartTab] = useState<ChartTab>('weight');
    const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
    const [currentVisits, setCurrentVisits] = useState<any[]>([]);

    useEffect(() => {
        const fetchPatients = async () => {
            setIsPatientListLoading(true);
            setError(null);
            try {
                const response = await fetch(patientListEndpoint);
                if (!response.ok) {
                    throw new Error(`Failed to fetch patients. Server responded with status: ${response.status}`);
                }
                const data: Patient[] = await response.json();
                setPatients(data);
                if (data.length > 0) {
                    setSelectedPatient(data[0].PATIENT_ID);
                }
            } catch (err) {
                console.error(err);
                setError(`Could not load patient list from ${patientListEndpoint}`);
            }
            finally {
                setIsPatientListLoading(false);
            }
        };
        fetchPatients();
    }, [patientListEndpoint]);

    useEffect(() => {
        if (!selectedPatient || isPatientListLoading) {
            if (isPatientListLoading) return;
            setDashboardData(null);
            setCurrentPatient(null);
            setCurrentVisits([]);
            setIsLoading(false);
            return;
        };

        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);
            setDashboardData(null);
            setCurrentPatient(null);
            setCurrentVisits([]);

            try {
                // --- 1. Get Patient History (from cache) ---
                const historyUrl = `${dashboardApiEndpoint}/${selectedPatient}`;
                console.log("Fetching history from:", historyUrl);

                const historyResponse = await fetch(historyUrl);
                if (!historyResponse.ok) {
                    throw new Error(`Failed to fetch patient details. Server responded with status: ${historyResponse.status}`);
                }

                const historyData = await historyResponse.json();
                const { patient, visits, deliveries, babies } = historyData;

                setCurrentPatient(patient);
                setCurrentVisits(visits);

                const latestVisit = visits.length > 0 ? [...visits].sort((a, b) => new Date(b.VISIT_DATE).getTime() - new Date(a.VISIT_DATE).getTime())[0] : {};


                // --- 2. Get Predictions (ONLY for ongoing patients) ---
                let predictions: any = {
                    progression: {},
                    deliveryType: {},
                    deliveryMode: {},
                    riskScores: {},
                    expectedGestationalAge: null,
                    expectedBirthWeight: null
                };

                let averages: any = {};

                if (isOngoing) {
                    console.log("Fetching predictions from rule-based engine...");
                    const predictionResponse = await fetch('https://healthgestbackend-na12.onrender.com/api/ai/ongoing-progression', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ visits, patient })
                    });

                    if (predictionResponse.ok) {
                        const predData = await predictionResponse.json();
                        if (predData.success) {
                            predictions = predData;
                            averages = predData.averages || {};
                            console.log("Predictions received:", predictions);
                            console.log("Averages received:", averages);
                        }
                    } else {
                        console.error("Prediction API call failed");
                    }
                }

                // --- 3. Combine All Data into the DashboardData object ---
                const mapProgression = (progArray: any[], key: string) =>
                    (progArray || []).map(p => ({ GESTATIONAL_AGE_WEEKS: p.week, [key]: p.value }));

                const mapBpProgression = (sysArray: any[], diaArray: any[]) =>
                    (sysArray || []).map((p, index) => ({
                        GESTATIONAL_AGE_WEEKS: p.week,
                        PREDICTED_BP_SYSTOLIC: p.value,
                        PREDICTED_BP_DIASTOLIC: diaArray[index]?.value
                    }));

                const deliveryRecord = deliveries && deliveries[0] ? deliveries[0] : {};
                const babyRecord = babies && babies[0] ? babies[0] : {};

                const historicalWeight = visits.map(v => ({ GESTATIONAL_AGE_WEEKS: v.GESTATIONAL_AGE_WEEKS, MATERNAL_WEIGHT: v.MATERNAL_WEIGHT }));
                const historicalFundal = visits.map(v => ({ GESTATIONAL_AGE_WEEKS: v.GESTATIONAL_AGE_WEEKS, FUNDAL_HEIGHT: v.FUNDAL_HEIGHT }));
                const historicalHb = visits.map(v => ({ GESTATIONAL_AGE_WEEKS: v.GESTATIONAL_AGE_WEEKS, HEMOGLOBIN_LEVEL: v.HEMOGLOBIN_LEVEL }));
                const historicalBp = visits.map(v => {
                    const bp = v.BLOOD_PRESSURE ? v.BLOOD_PRESSURE.split('/') : [null, null];
                    return {
                        GESTATIONAL_AGE_WEEKS: v.GESTATIONAL_AGE_WEEKS,
                        BP_SYSTOLIC: bp[0] ? Number(bp[0]) : null,
                        BP_DIASTOLIC: bp[1] ? Number(bp[1]) : null
                    }
                });

                const predictedWeight = mapProgression(predictions.progression.weight, 'PREDICTED_WEIGHT');
                const predictedFundal = mapProgression(predictions.progression.fundal, 'PREDICTED_FUNDAL_HEIGHT');
                const predictedHb = mapProgression(predictions.progression.hb, 'PREDICTED_HEMOGLOBIN_LEVEL');
                const predictedBp = mapBpProgression(predictions.progression.systolic, predictions.progression.diastolic);

                console.log("Historical Hb data (from visits):", historicalHb);
                console.log("Predicted Hb data (from engine):", predictedHb);

                const expectedDeliveryGA = predictions.expectedGestationalAge;
                const expectedBirthWeight = predictions.expectedBirthWeight;

                let expectedDeliveryDate = null;
                if (isOngoing && latestVisit.ESTIMATED_DUE_DATE) {
                    expectedDeliveryDate = new Date(latestVisit.ESTIMATED_DUE_DATE).toISOString().split('T')[0];
                }

                const finalData: DashboardData = {
                    kpiData: {
                        MATERNAL_WEIGHT: latestVisit.MATERNAL_WEIGHT,
                        FUNDAL_HEIGHT: latestVisit.FUNDAL_HEIGHT,
                        HEMOGLOBIN_LEVEL: latestVisit.HEMOGLOBIN_LEVEL,
                        BLOOD_PRESSURE: latestVisit.BLOOD_PRESSURE,
                        GESTATIONAL_AGE_WEEKS: latestVisit.GESTATIONAL_AGE_WEEKS,
                        ESTIMATED_DUE_DATE: latestVisit.ESTIMATED_DUE_DATE,
                    },
                    deliveryData: {
                        DELIVERY_DATE: isOngoing ? expectedDeliveryDate : deliveryRecord.DELIVERY_DATE,
                        DELIVERY_MODE: deliveryRecord.DELIVERY_MODE,
                        MOTHER_CONDITION_POST_DELIVERY: deliveryRecord.MOTHER_CONDITION_POST_DELIVERY,
                        GESTATIONAL_AGE_AT_DELIVERY: isOngoing ? expectedDeliveryGA : deliveryRecord.GESTATIONAL_AGE_AT_DELIVERY,
                    },
                    visitCounts: {
                        VISIT_COUNT: visits.length,
                        VACCINATED_COUNT: visits.filter(v => v.VACCINATION === 'Yes').length,
                    },
                    babyData: {
                        BIRTH_WEIGHT: isOngoing ? expectedBirthWeight : babyRecord.BIRTH_WEIGHT,
                        DISCHARGE_DATE: babyRecord.DISCHARGE_DATE,
                        SOURCE_SCHEMA: babyRecord.SOURCE_SCHEMA,
                    },
                    patientProfile: {
                        DATE_OF_BIRTH: patient.DATE_OF_BIRTH,
                        BLOOD_TYPE: patient.BLOOD_TYPE,
                        MEDICAL_HISTORY: patient.MEDICAL_HISTORY,
                        BMI_STATUS: patient.BMI_STATUS,
                    },
                    charts: {
                        maternalWeight: [...historicalWeight, ...predictedWeight],
                        fundalHeight: [...historicalFundal, ...predictedFundal],
                        hemoglobin: [...historicalHb, ...predictedHb],
                        bloodPressure: [...historicalBp, ...predictedBp],
                        averageWeight: averages.averageWeight || [],
                        averageFundal: averages.averageFundal || [],
                        averageHemoglobin: averages.averageHemoglobin || [],
                        averageBloodPressure: averages.averageBloodPressure || [],
                    },
                    riskScores: predictions.riskScores,
                    deliveryType: predictions.deliveryType,
                    deliveryMode: predictions.deliveryMode
                };

                setDashboardData(finalData);

            } catch (err) {
                console.error(err);
                setError('Could not load dashboard data for this patient.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedPatient, isPatientListLoading, dashboardApiEndpoint, isOngoing]);

    const patientOptions = patients.map(p => ({
        value: p.PATIENT_ID,
        label: `${p.PATIENT_NAME} (ID: ${p.PATIENT_ID})`
    }));

    const PatientSelector = () => (
        <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <label htmlFor="patient-select" className={`block text-lg font-medium text-gray-500 mb-1 ${isPatientListLoading ? 'opacity-50' : ''}`}>
                {selectorLabel}
            </label>
            <select
                id="patient-select"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                disabled={isPatientListLoading || patients.length === 0}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            >
                {isPatientListLoading ? (
                    <option>Loading patients...</option>
                ) : patients.length === 0 ? (
                    <option>{noPatientsMessage}</option>
                ) : (
                    patientOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))
                )}
            </select>
        </div>
    );

    const renderDashboardContent = () => {
        if (isLoading) return <div className="text-center p-8 text-gray-600">Loading Patient Dashboard...</div>;
        if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

        if (!dashboardData || !selectedPatient) {
            if (isPatientListLoading) return <div className="text-center p-8 text-gray-600">Loading patient list...</div>;
            if (patients.length === 0) return <div className="text-center p-8 text-gray-600">{noPatientsMessage}.</div>;
            return <div className="text-center p-8 text-gray-600">Please select a patient to view data.</div>;
        }

        const { kpiData, deliveryData, visitCounts, charts, babyData, patientProfile, riskScores, deliveryType, deliveryMode } = dashboardData;

        // --- Data Calculation Logic ---
        type ChangeType = 'increase' | 'decrease' | 'stable';
        interface ChangeResult { change: string; changeType: ChangeType; }
        const calculateChange = (dataArray: any[], key: string, unit: string): ChangeResult => {
            const realData = dataArray.filter(d => d[key] != null);
            if (!realData || realData.length < 2) return { change: '', changeType: 'stable' };
            const last = realData.length - 1;
            const current = realData[last]?.[key];
            const previous = realData[last - 1]?.[key];
            if (typeof current !== 'number' || typeof previous !== 'number') return { change: '', changeType: 'stable' };
            const diff = current - previous;
            if (Math.abs(diff) <= 0.1) return { change: '', changeType: 'stable' };
            return { change: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${unit}`, changeType: diff > 0 ? 'increase' : 'decrease' };
        };
        const calculateBPChange = (dataArray: any[], key: string): ChangeResult => {
            const realData = dataArray.filter(d => d[key] != null);
            if (!realData || realData.length < 2) return { change: '', changeType: 'stable' };
            const last = realData.length - 1;
            const current = realData[last]?.[key];
            const previous = realData[last - 1]?.[key];

            if (typeof current !== 'number' || typeof previous !== 'number') return { change: '', changeType: 'stable' };
            const diff = current - previous;
            if (diff === 0) return { change: '', changeType: 'stable' };
            return { change: `${diff > 0 ? '+' : ''}${diff} (sys)`, changeType: diff > 0 ? 'increase' : 'decrease' };
        };

        const weightChange = calculateChange(charts.maternalWeight, 'MATERNAL_WEIGHT', 'kg');
        const fundalChange = calculateChange(charts.fundalHeight, 'FUNDAL_HEIGHT', 'cm');
        const hbChange = calculateChange(charts.hemoglobin, 'HEMOGLOBIN_LEVEL', 'g/dL');
        const bpChange = calculateBPChange(charts.bloodPressure, 'BP_SYSTOLIC');

        const formattedDeliveryDate = deliveryData?.DELIVERY_DATE ? new Date(deliveryData.DELIVERY_DATE.split('T')[0]).toLocaleDateString() : 'N/A';
        const formattedDischargeDate = babyData?.DISCHARGE_DATE ? new Date(babyData.DISCHARGE_DATE.split('T')[0]).toLocaleDateString() : 'N/A';
        const formattedDOB = patientProfile?.DATE_OF_BIRTH ? new Date(patientProfile.DATE_OF_BIRTH).toLocaleDateString() : 'N/A';

        const birthWeightValue = babyData?.BIRTH_WEIGHT;
        let birthWeight = 'N/A';
        const weightUnit = (birthWeightValue != null) ? 'kg' : '';

        if (typeof birthWeightValue === 'number') {
            // The 'expected' weight (isOngoing) is already in kg, 
            // but the 'historical' weight (from the DB) is in grams.
            if (!isOngoing && birthWeightValue > 100) {
                // If it's a historical record and over 100, assume grams and convert
                birthWeight = (birthWeightValue / 1000).toFixed(1);
            } else {
                // Otherwise, it's an expected weight (already in kg) or a small number
                birthWeight = birthWeightValue.toFixed(1);
            }
        }

        const ageAtDelivery = deliveryData?.GESTATIONAL_AGE_AT_DELIVERY ? deliveryData.GESTATIONAL_AGE_AT_DELIVERY.toFixed(1) : 'N/A';

        const weightKpi: KpiData = { title: 'Last Maternal Weight', value: kpiData.MATERNAL_WEIGHT?.toString() || 'N/A', unit: 'kg', change: weightChange.change, changeType: weightChange.changeType, icon: ICONS.weight };
        const fundalKpi: KpiData = { title: 'Last Fundal Height', value: kpiData.FUNDAL_HEIGHT?.toString() || 'N/A', unit: 'cm', change: fundalChange.change, changeType: fundalChange.changeType, icon: ICONS.ruler };
        const hbKpi: KpiData = { title: 'Last HB Level', value: kpiData.HEMOGLOBIN_LEVEL?.toString() || 'N/A', unit: 'g/dL', change: hbChange.change, changeType: hbChange.changeType, icon: ICONS.heart };
        const bpKpi: KpiData = { title: 'Last BP Level', value: kpiData.BLOOD_PRESSURE || 'N/A', unit: 'mmHg', change: bpChange.change, changeType: bpChange.changeType, icon: ICONS.heart };

        const visitKpi: KpiData = { title: 'Visit Count', value: visitCounts.VISIT_COUNT?.toString() || '0', unit: '', change: '', changeType: 'stable', icon: ICONS.ruler };

        const conditionKpi: KpiData = { title: 'Mother Condition', value: deliveryData?.MOTHER_CONDITION_POST_DELIVERY || 'N/A', unit: '', change: '', changeType: 'stable', icon: ICONS.heart };

        const gestationalAgeKpi: KpiData = {
            title: 'Current Gestational Age',
            value: kpiData.GESTATIONAL_AGE_WEEKS != null ? kpiData.GESTATIONAL_AGE_WEEKS.toString() : 'N/A',
            unit: 'weeks',
            change: '',
            changeType: 'stable',
            icon: ICONS.baby
        };

        const getConditionStatus = (): KpiStatus => {
            const condition = deliveryData?.MOTHER_CONDITION_POST_DELIVERY?.toLowerCase();
            if (condition === 'stable') return 'positive';
            if (condition === 'unstable' || condition === 'critical') return 'critical';
            return 'stable';
        };

        const ChartTabs = () => {
            const tabs: { key: ChartTab, label: string }[] = [
                { key: 'weight', label: 'Maternal Weight' },
                { key: 'growth', label: 'Fetal Growth' },
                { key: 'hb', label: 'Hemoglobin' },
                { key: 'bp', label: 'Blood Pressure' },
            ];

            return (
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveChartTab(tab.key)}
                                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-lg
                  ${activeChartTab === tab.key
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

        const renderRiskScores = () => {
            if (!riskScores) return <ProfileItem icon={ICONS.heart} label="Risk Analysis" value="N/A" />;
            const riskEntries = Object.entries(riskScores).filter(([key, value]) => value > 0.2);
            if (riskEntries.length === 0) {
                return <ProfileItem icon={ICONS.heart} label="Overall Risk" value="Low" />;
            }
            const formatLabel = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return riskEntries.map(([key, value]) => (
                <ProfileItem
                    key={key}
                    icon={ICONS.heart}
                    label={formatLabel(key)}
                    value={`${Math.round(value * 100)}% Risk`}
                />
            ));
        };

        // Helper function to get the predicted value with its probability
        const getPredictedValueWithProbability = (
            probabilityObject: { [key: string]: number } | undefined,
            isMode: boolean // true for DeliveryMode, false for DeliveryType
        ) => {
            if (!probabilityObject || Object.keys(probabilityObject).length === 0) {
                return 'N/A';
            }

            // Find the key with the highest probability
            const [winner, probability] = Object.entries(probabilityObject).reduce(
                (acc, [key, value]) => (value > acc[1] ? [key, value] : acc),
                ["", 0]
            );

            const percentage = Math.round(probability * 100);

            if (isMode) {
                // For Delivery Mode (e.g., "CSection", "Normal")
                const label = winner === 'CSection' ? 'C-Section' : 'Vaginal';
                return `${label} (${percentage}%)`;
            } else {
                // For Delivery Type (e.g., "FullTerm", "Premature")
                let label = 'Unknown';
                if (winner === 'FullTerm') label = 'Matured';
                if (winner === 'Premature') label = 'Premature';
                if (winner === 'MortalityRisk') label = 'Mortality Risk';

                if (label === 'Premature' || label === 'Mortality Risk') {
                    return `${label.toUpperCase()} (${percentage}%)`;
                }
                return `${label} (${percentage}%)`;
            }
        };


        return (
            <div className="space-y-6">

                {/* --- KPI Cards (Row 1) --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <DashboardKpiCard data={visitKpi} isHighlighted={true} />
                    {isOngoing ? (
                        <DashboardKpiCard data={gestationalAgeKpi} isHighlighted={true} />
                    ) : (
                        <DashboardKpiCard data={conditionKpi} status={getConditionStatus()} />
                    )}
                </div>

                {/* --- Info Cards (Row 2) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GroupCard title="Patient Profile">
                        <ProfileItem icon={ICONS.baby} label="Date of Birth" value={formattedDOB} />
                        <ProfileItem icon={ICONS.heart} label="Blood Type" value={patientProfile?.BLOOD_TYPE} />
                        <ProfileItem icon={ICONS.weight} label="BMI Status" value={patientProfile?.BMI_STATUS} />
                        <ProfileItem
                            icon={ICONS.heart}
                            label="Medical History"
                            value={patientProfile?.MEDICAL_HISTORY}
                            tooltip={patientProfile?.MEDICAL_HISTORY}
                        />
                    </GroupCard>

                    <GroupCard title={isOngoing ? "Expected Delivery & Baby Info" : "Delivery & Baby Info"}>

                                                {/* Add this status badge at the top */}
                        {!isOngoing && deliveryData?.DELIVERY_MODE === 'Va' && babyData?.SOURCE_SCHEMA === 'Matured' && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                            <div className="flex items-center">
                                <span className="text-green-600 font-semibold">✓ Ideal Delivery Outcome</span>
                            </div>
                            <p className="text-green-600 text-sm mt-1">Normal delivery with matured term</p>
                            </div>
                        )}

                         <ProfileItem
                            icon={ICONS.baby}
                            label={isOngoing ? "Expected Delivery Mode" : "Delivery Mode"}
                            value={isOngoing ? getPredictedValueWithProbability(deliveryMode, true) : deliveryData?.DELIVERY_MODE}
                            highlight={!isOngoing && deliveryData?.DELIVERY_MODE === 'Vaginal'}
                        />
                        <ProfileItem
                            icon={ICONS.baby}
                            label={isOngoing ? "Expected Term Status" : "Term Status"}
                            value={isOngoing ? getPredictedValueWithProbability(deliveryType, false) : babyData?.SOURCE_SCHEMA}
                            highlight={!isOngoing && babyData?.SOURCE_SCHEMA === 'MATURED'}
                        />

                        <ProfileItem icon={ICONS.baby} label={isOngoing ? "Expected Gestational Age" : "Gestational Age at Delivery"} value={`${ageAtDelivery} weeks`} />
                        <ProfileItem icon={ICONS.baby} label={isOngoing ? "Expected Birth Weight" : "Baby Birth Weight"} value={`${birthWeight} ${weightUnit}`} />

                    </GroupCard>
                </div>

                {/* --- Probability Cards (Row 3) --- */}
                {isOngoing && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ProbabilityBars title="Delivery Type Probability" probabilities={deliveryType} />
                        <ProbabilityBars title="Delivery Mode Probability" probabilities={deliveryMode} />
                    </div>
                )}

                {/* --- Info Cards (Row 4) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isOngoing ? (
                        <GroupCard title="Risk Factor Analysis">
                            {renderRiskScores()}
                        </GroupCard>
                    ) : (
                        <GroupCard title="Visit & Condition Summary">
                            <ProfileItem icon={ICONS.ruler} label="Vaccinated Count" value={visitCounts.VACCINATED_COUNT?.toString() || '0'} />
                            <ProfileItem icon={ICONS.baby} label="Last Gestational Age" value={`${kpiData.GESTATIONAL_AGE_WEEKS || 'N/A'} weeks`} />
                        </GroupCard>
                    )}

                    <GroupCard title={isOngoing ? "Expected Key Dates" : "Key Dates"}>
                        <ProfileItem icon={ICONS.baby} label={isOngoing ? "Expected Delivery Date" : "Delivery Date"} value={formattedDeliveryDate} />
                        {isOngoing ? null : (
                            <ProfileItem icon={ICONS.baby} label="Discharge Date" value={formattedDischargeDate} />
                        )}
                    </GroupCard>
                </div>


                {/* ⭐️ MODIFIED: This block is now Row 5 (was Row 6) */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                    <ChartTabs />
                    <div className="pt-4">
                        {activeChartTab === 'weight' && <MaternalWeightChart
                            data={charts.maternalWeight}
                            averageData={charts.averageWeight}
                            kpiData={weightKpi}
                        />}
                        {activeChartTab === 'growth' && <FetalGrowthChart
                            data={charts.fundalHeight}
                            averageData={charts.averageFundal}
                            kpiData={fundalKpi}
                        />}
                        {activeChartTab === 'hb' && <HemoglobinChart
                            data={charts.hemoglobin}
                            averageData={charts.averageHemoglobin}
                            kpiData={hbKpi}
                        />}
                        {activeChartTab === 'bp' && <BloodPressureChart
                            data={charts.bloodPressure}
                            averageData={charts.averageBloodPressure}
                            kpiData={bpKpi}
                        />}
                    </div>
                </div>

                {/* ⭐️ MODIFIED: This block is now Row 6 (was Row 5) */}
                {isOngoing && currentPatient && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AIPInsightCard
                            title="Diet Plan With AI"
                            apiEndpoint="/api/ai/diet-plan"
                            patient={currentPatient}
                            visits={currentVisits}
                            icon={ICONS.heart} // ⭐️ Using ICONS.heart as a placeholder
                        />
                        <AIPInsightCard
                            title="Exercise Plan With AI"
                            apiEndpoint="/api/ai/exercise-plan"
                            patient={currentPatient}
                            visits={currentVisits}
                            icon={ICONS.weight} // ⭐️ Using ICONS.weight as a placeholder
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PatientSelector />
            {renderDashboardContent()}
        </div>
    );
};