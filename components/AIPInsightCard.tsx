// components/AIPInsightCard.tsx
import React, { useState, useEffect } from 'react';
import type { Patient } from '../types';
import { ICONS } from '../constants';

interface AIPInsightCardProps {
    title: string;
    apiEndpoint: string;
    patient: Patient | null;
    visits: any[];
    icon: React.ReactNode;
}

// ⭐️ MODIFIED: This function now parses markdown bold tags (**)
const formatInsightText = (text: string) => {
    if (!text) return null;

    // Helper to render a single line, parsing **bold** tags
    const renderMarkdownLine = (line: string) => {
        // Split the line by the bold delimiter
        const parts = line.split('**');
        return parts.map((part, i) => {
            // Every odd part (index 1, 3, 5...) was between **
            if (i % 2 === 1) {
                return <strong key={i}>{part}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return text
        .split('\n')
        .map((line, index) => {
            line = line.trim();

            // Handle list items
            if (line.startsWith('* ')) {
                const lineContent = line.substring(2); // Get content without '* '
                return (
                    <li key={index} className="ml-4 list-disc">
                        {renderMarkdownLine(lineContent)}
                    </li>
                );
            }

            // Handle empty lines
            if (line.length === 0) {
                return <br key={index} />;
            }

            // Handle all other lines as paragraphs
            return (
                <p key={index} className="mb-1">
                    {renderMarkdownLine(line)}
                </p>
            );
        });
};

export const AIPInsightCard: React.FC<AIPInsightCardProps> = ({
    title,
    apiEndpoint,
    patient,
    visits,
    icon,
}) => {
    const [insight, setInsight] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);

    const fetchInsight = async () => {
        if (!patient || visits.length === 0) {
            setInsight('Please select a patient with visits to generate insights.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setInsight('');

        try {
            const response = await fetch(`https://healthgestbackend-na12.onrender.com${apiEndpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient, visits }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch AI insight from server.');
            }

            const data = await response.json();

            if (data.success) {
                setInsight(data.dietPlan || data.exercisePlan || 'No plan generated.');
                setGeneratedAt(new Date().toLocaleString());
            } else {
                throw new Error(data.error || 'Failed to generate insight.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unknown error occurred.');
            setInsight('');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (patient?.PATIENT_ID) {
            fetchInsight();
        }
    }, [patient?.PATIENT_ID]);

    return (
        // Added overflow-hidden to fix layout shift
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4 flex flex-col h-[500px] overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    {icon}
                    <span className="ml-2">{title}</span>
                </h3>
            </div>

            <button
                onClick={fetchInsight}
                disabled={isLoading}
                className="mb-3 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center self-start"
            >
                <svg
                    className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2m0 0H15"
                    />
                </svg>
                {isLoading ? 'Refreshing...' : 'Refresh Plan'}
            </button>

            {/* ⭐️ REMOVED break-all class from here */}
            <div className="flex-grow overflow-y-auto overflow-x-hidden p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700 text-sm">
                {isLoading && <p className="text-gray-500">Generating plan...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!isLoading && !error && (
                    <div className="prose prose-sm max-w-none">
                        {formatInsightText(insight)}
                    </div>
                )}
            </div>
            {generatedAt && !isLoading && !error && (
                <p className="text-xs text-gray-400 mt-2">
                    Generated by Gemini • {generatedAt}
                </p>
            )}
        </div>
    );
};