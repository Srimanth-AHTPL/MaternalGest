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
    filter?: {
        address: string;
        patientCount: number;
    };
    error?: string;
}

interface AddressOption {
    value: string;
    label: string;
}

interface HomePageProps {
    setPage: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
    const [summaryData, setSummaryData] = useState<HomeSummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>('all');
    const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
    const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

    // Fetch addresses on component mount
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await fetch('https://healthgestbackend-na12.onrender.com/api/patient-addresses');
                if (!response.ok) {
                    throw new Error('Failed to fetch addresses');
                }
                const data = await response.json();
                if (data.success) {
                    setAddressOptions(data.addresses);
                }
            } catch (err) {
                console.error('Failed to load addresses:', err);
                setError('Unable to load location data');
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        fetchAddresses();
    }, []);

    // Fetch summary data when address changes
    useEffect(() => {
        const fetchSummaryData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = selectedAddress === 'all' 
                    ? 'https://healthgestbackend-na12.onrender.com/api/home-summary'
                    : `https://healthgestbackend-na12.onrender.com/api/home-summary-filtered?address=${encodeURIComponent(selectedAddress)}`;
                
                const response = await fetch(url);
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

        if (!isLoadingAddresses) {
            fetchSummaryData();
        }
    }, [selectedAddress, isLoadingAddresses]);

    // Handle address filter change
    const handleAddressChange = (address: string) => {
        setSelectedAddress(address);
        setIsAddressDropdownOpen(false);
    };

    // Pie Chart Component for Delivery Types
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
                
                <div className="flex flex-col lg:flex-row items-center justify-center">
                    <div className="relative w-48 h-48">
                        <div 
                            className="w-full h-full rounded-full border-4 border-gray-200"
                            style={pieChartStyle}
                        />
                        
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

    // Clickable HomeKpiCard component
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

    // Simple Delivery Distribution Component
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

    const selectedAddressLabel = addressOptions.find(opt => opt.value === selectedAddress)?.label || 'All Locations';

    return (
        <div className="min-h-[30vh] bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col items-center w-full py-8">
            {/* Main Content */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with Address Dropdown */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 text-center sm:text-left">
                        Healthcare Dashboard
                    </h1>
                    
                    {/* Address Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
                            disabled={isLoadingAddresses}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingAddresses ? (
                                <span className="text-gray-500">Loading locations...</span>
                            ) : (
                                <>
                                    <span className="text-gray-700">
                                        {selectedAddressLabel}
                                    </span>
                                    <svg 
                                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isAddressDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {isAddressDropdownOpen && !isLoadingAddresses && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                                <div className="py-1">
                                    {addressOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleAddressChange(option.value)}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 ${
                                                selectedAddress === option.value 
                                                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                                    : 'text-gray-700'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Selected Address Indicator */}
                {selectedAddress !== 'all' && summaryData && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-700 text-center">
                            Showing data for: <strong>{selectedAddressLabel}</strong>
                            {summaryData.filter && ` (${summaryData.filter.patientCount} patients)`}
                        </p>
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
                        {/* KPI Grid */}
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
                        
                        {/* Top Stats Row */}
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