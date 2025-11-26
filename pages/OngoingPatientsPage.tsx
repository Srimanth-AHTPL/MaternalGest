// pages/OngoingPatientsPage.tsx
import React from 'react';
import { PatientDashboard } from '../components/PatientDashboard.tsx';

// pages/OngoingPatientsPage.tsx
// If the above doesn't work, try this instead:
const OngoingPatientsPage: React.FC = () => {
    return (
        <div className="flex justify-center"> {/* ADD THIS */}
            <div className="w-full max-w-7xl"> {/* ADD THIS */}
                <PatientDashboard
                    patientListEndpoint="https://healthgestbackend-na12.onrender.com/api/ongoing-patients"
                    dashboardApiEndpoint="https://healthgestbackend-na12.onrender.com/api/ongoing-patientDetails"
                    selectorLabel="Select Ongoing Patient"
                    noPatientsMessage="No ongoing patients found"
                    isOngoing={true}
                />
            </div>
        </div>
    );
};

export default OngoingPatientsPage;