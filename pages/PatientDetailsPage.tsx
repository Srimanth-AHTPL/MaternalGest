// pages/PatientDetailsPage.tsx
import React from 'react';
import { PatientDashboard } from '../components/PatientDashboard.tsx';

const PatientDetailsPage: React.FC = () => {
    return (
        <PatientDashboard
            patientListEndpoint="https://maternal-gest-backend.onrender.com/api/patients"
            dashboardApiEndpoint="https://maternal-gest-backend.onrender.com/api/patientDetails"
            selectorLabel="Select Patient"
            noPatientsMessage="No patients found"
            isOngoing={false}
        />
    );
};

export default PatientDetailsPage;
