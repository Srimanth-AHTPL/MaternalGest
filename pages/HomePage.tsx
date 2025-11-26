// pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants.tsx';
import type { HomeKpiData, Page } from '../types.ts';
import { HomeKpiCard, KpiCardSkeleton } from '../components/SharedComponents.tsx';

interface HomeSummaryData {
    success?: boolean;
    totalPatients: number;
    activePregnancies: number;
    historicalPatients: number;
    normalDeliveryCount: number;
    cSectionDeliveryCount: number;
    totalDeliveries: number;
    totalBabies: number;
    todaysAppointments: number;
    normalDeliveryRate: number;
    cSectionRate: number;
    deliveryTypes: {
        matured: number;
        premature: number;
        mortality: number;
        maturedCount: number;
        prematureCount: number;
        mortalityCount: number;
    };
    error?: string;
}

interface HomePageProps {
    setPage: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
    const [summaryData, setSummaryData] = useState<HomeSummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummaryData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('https://healthgestbackend.onrender.com/api/home-summary');
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                const data: HomeSummaryData = await response.json();
                
                if (data.success === false) {
                    setError(data.error || 'Failed to load data');
                } else {
                    setSummaryData(data);
                }
            } catch (err) {
                console.error('Failed to load dashboard:', err);
                setError('Unable to connect to data server');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummaryData();
    }, []);

    // Pie Chart Component for Delivery Types - UPDATED to use real data
    const DeliveryTypePieChart: React.FC<{ 
    matured: number; 
    premature: number; 
    mortality: number;
    maturedCount: number;
    prematureCount: number;
    mortalityCount: number;
}> = ({ 
    matured, 
    premature, 
    mortality,
    maturedCount,
    prematureCount,
    mortalityCount
}) => {
    const totalPercentage = matured + premature + mortality;
    
    // Create conic gradient for the pie chart
    const pieChartStyle = {
        background: `conic-gradient(
            #10b981 0% ${matured}%,
            #f59e0b ${matured}% ${matured + premature}%,
            #ef4444 ${matured + premature}% ${totalPercentage}%,
            #e5e7eb ${totalPercentage}% 100%
        )`
    };

    return (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Delivery Types</h3>
            
            {/* Pie Chart Visualization */}
            <div className="flex flex-col lg:flex-row items-center justify-center">
                {/* CSS-based Pie Chart */}
                <div className="relative w-48 h-48">
                    <div 
                        className="w-full h-full rounded-full border-4 border-gray-200"
                        style={pieChartStyle}
                    />
                    
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-sm">
                            <div>
                                <div className="text-xl font-bold text-gray-900"></div>
                                <div className="text-xs text-gray-600"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{matured}%</div>
                    <div className="text-sm text-gray-600">Matured ({maturedCount})</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{premature}%</div>
                    <div className="text-sm text-gray-600">Premature ({prematureCount})</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{mortality}%</div>
                    <div className="text-sm text-gray-600">Mortality ({mortalityCount})</div>
                </div>
            </div>
        </div>
    );
};

    // Clickable HomeKpiCard component - Larger size
    const ClickableHomeKpiCard: React.FC<{ data: HomeKpiData; onClick?: () => void }> = ({ data, onClick }) => {
        return (
            <div 
                onClick={onClick}
                className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-all duration-200 flex items-center space-x-4 ${
                    onClick ? 'cursor-pointer hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1' : ''
                }`}
            >
                <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-full text-indigo-600">
                    <div className="text-2xl">
                        {data.icon}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-3xl font-bold text-gray-900 truncate">{data.value}</div>
                    <div className="text-lg font-medium text-gray-600 truncate">{data.title}</div>
                </div>
            </div>
        );
    };

    // Simple Delivery Distribution Component - Larger size
    const DeliveryDistribution: React.FC<{ normalRate: number; cSectionRate: number }> = ({ normalRate, cSectionRate }) => (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Delivery Methods</h3>
            <div className="space-y-10">
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-lg text-gray-700 font-semibold">Normal Deliveries</span>
                        <span className="text-green-600 font-bold text-xl">{normalRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                            className="bg-green-500 h-4 rounded-full transition-all duration-500" 
                            style={{ width: `${normalRate}%` }}
                        ></div>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-lg text-gray-700 font-semibold">C-Section Deliveries</span>
                        <span className="text-blue-600 font-bold text-xl">{cSectionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                            className="bg-blue-500 h-4 rounded-full transition-all duration-500" 
                            style={{ width: `${cSectionRate}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Clean KPI Cards Data with navigation
    const kpis = summaryData ? [
        { 
            title: 'Active Pregnancies', 
            value: summaryData.activePregnancies.toLocaleString(), 
            icon: ICONS.activePregnancies,
            onClick: () => setPage('ONGOING_PATIENTS')
        },
        { 
            title: 'Total Deliveries', 
            value: summaryData.totalDeliveries.toLocaleString(), 
            icon: ICONS.heart 
        },
        { 
            title: 'Normal Deliveries', 
            value: summaryData.normalDeliveryCount.toLocaleString(), 
            icon: ICONS.baby 
        },
        { 
            title: 'C-Section Deliveries', 
            value: summaryData.cSectionDeliveryCount.toLocaleString(), 
            icon: ICONS.baby 
        },
        { 
            title: 'Babies Born', 
            value: summaryData.totalBabies.toLocaleString(), 
            icon: ICONS.baby 
        },
        { 
            title: "Today's Appointments", 
            value: summaryData.todaysAppointments.toLocaleString(), 
            icon: ICONS.appointments 
        },
    ] : [];

    return (
        <div className="min-h-[30vh] bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col items-center w-full py-8">
            {/* Main Content - Proper width and spacing */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <KpiCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* Data Content */}
                {!isLoading && summaryData && (
                    <div className="space-y-8">


                        {/* KPI Grid - Larger cards */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                Key Metrics
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {kpis.map((kpi, index) => (
                                    <ClickableHomeKpiCard 
                                        key={index}
                                        data={kpi} 
                                        onClick={kpi.onClick}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        {/* Top Stats Row - Three columns now */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <DeliveryDistribution 
                                normalRate={summaryData.normalDeliveryRate} 
                                cSectionRate={summaryData.cSectionRate} 
                            />
                            <DeliveryTypePieChart 
                                matured={summaryData.deliveryTypes.matured}
                                premature={summaryData.deliveryTypes.premature}
                                mortality={summaryData.deliveryTypes.mortality}
                                maturedCount={summaryData.deliveryTypes.maturedCount}
                                prematureCount={summaryData.deliveryTypes.prematureCount}
                                mortalityCount={summaryData.deliveryTypes.mortalityCount}
                            />
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Patient Overview</h3>
                                <div className="space-y-6">
                                    <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="text-4xl font-bold text-blue-600">{summaryData.activePregnancies.toLocaleString()}</div>
                                        <div className="text-lg text-gray-700 font-semibold mt-2">Active Pregnancies</div>
                                    </div>
                                    <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-300">
                                        <div className="text-4xl font-bold text-gray-600">{summaryData.historicalPatients.toLocaleString()}</div>
                                        <div className="text-lg text-gray-700 font-semibold mt-2">Historical Patients</div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;