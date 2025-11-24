// components/Layout.tsx
import React, { ReactNode } from 'react';
import { ICONS } from '../constants.tsx';
import type { Page } from '../types.ts';
import logoImage from './image/image.png'; // Import your image

const Layout: React.FC<{ page: Page, setPage: (page: Page) => void, children: ReactNode }> = ({ page, setPage, children }) => {

    // --- NavLink Sub-component ---
    const NavLink: React.FC<{
        label: string;
        icon: ReactNode;
        targetPage: Page;
    }> = ({ label, icon, targetPage }) => {
        const isActive = page === targetPage;
        return (
            <button
                onClick={() => setPage(targetPage)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors duration-150 text-base
          ${isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                    }
        `}
            >
                {icon}
                <span>{label}</span>
            </button>
        );
    };

    // Function to get title based on current page
    const getTitle = () => {
        switch (page) {
            case 'HOME':
                return 'HealthGest Maternity Tracker';
            case 'PATIENT_DETAILS':
                return 'Patient Management';
            case 'ONGOING_PATIENTS':
                return 'Ongoing Visits Dashboard';
            default:
                return 'HealthGest Maternity Tracker';
        }
    };

    // Function to get subtitle based on current page
    const getSubtitle = () => {
        switch (page) {
            case 'HOME':
                return 'Compassionate Care for Every Mother and Child';
            case 'PATIENT_DETAILS':
                return 'Manage and Monitor Patient Information';
            case 'ONGOING_PATIENTS':
                return 'Track Current Patient Visits and Progress';
            default:
                return 'Compassionate Care for Every Mother and Child';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col w-full">
            {/* --- Main Header --- */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                <nav className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top Row: Logo + Navigation */}
                    <div className="flex justify-between items-center h-16 w-full">
                        {/* LEFT: Company Logo */}
                        <div className="flex items-center">
                            <img 
                                src={logoImage} 
                                alt="Company Logo" 
                                className="h-10 w-auto max-w-40 object-contain" 
                            />
                        </div>

                        {/* RIGHT: Navigation Links */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <NavLink label="Home" icon={ICONS.home} targetPage="HOME" />
                            <NavLink label="Patient Details" icon={ICONS.users} targetPage="PATIENT_DETAILS" />
                            <NavLink label="Ongoing Visits" icon={ICONS.clipboard} targetPage="ONGOING_PATIENTS" />
                        </div>
                    </div>
                </nav>
            </header>

            {/* --- Title Layer / Dashboard Header --- */}
            <header className="">
                <nav className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-24">
                        {/* Logo and Title - CENTERED */}
                        <div className="flex items-center space-x-4">
                            {/* White background for logo 
                            <div className="p-3 bg-white rounded-full shadow-lg border border-gray-200">
                                <div className="text-indigo-600 text-2xl">
                                    {ICONS.logo}
                                </div>
                            </div>*/}
                            <div className="flex flex-col justify-center text-center">
                                <span className="text-3xl font-bold text-indigo-600 leading-tight">
                                    {getTitle()}
                                </span>
                                <div className="text-base text-gray-900 font-medium mt-1">
                                    {getSubtitle()}
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            {/* --- Page Content --- */}
            <main className="flex-grow">
                {page === 'PATIENT_DETAILS' || page === 'ONGOING_PATIENTS' ? (
                    <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {children}
                    </div>
                ) : (
                    children // Home page has its own padding/layout
                )}
            </main>

            {/* --- Footer --- */}
            <footer className="bg-gray-900 text-gray-300 py-3">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-lg font-semibold">© {new Date().getFullYear()} HealthGest Maternity Tracker | All Rights Reserved</p>
                    <p className="mt-2 text-base">Contact: +91-98765-43210 | info@healthgestmt.com</p>
                    <p className="mt-3 text-sm text-gray-400">
                        Providing compassionate care for every mother and child
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;