// pages/PatientDetailsPage.tsx
import React from 'react';
import { PatientDashboard } from '../components/PatientDashboard.tsx';

const PatientDetailsPage: React.FC = () => {
    return (
        <PatientDashboard
            patientListEndpoint="https://healthgestbackend-na12.onrender.com/api/patients"
            dashboardApiEndpoint="https://healthgestbackend-na12.onrender.com/api/patientDetails"
            selectorLabel="Select Patient"
            noPatientsMessage="No patients found"
            isOngoing={false}
        />
    );
};

export default PatientDetailsPage;