// App.tsx
import React, { useState } from 'react';
import type { Page } from './types.ts';

// Import Pages
import HomePage from './pages/HomePage.tsx';
import PatientDetailsPage from './pages/PatientDetailsPage.tsx';
import OngoingPatientsPage from './pages/OngoingPatientsPage.tsx';

// Import Layout
import Layout from './components/Layout.tsx';


//==============================================================================
// 7. MAIN APP COMPONENT
//==============================================================================
const App: React.FC = () => {
  // Add state to manage which page is active
  const [page, setPage] = useState<Page>('HOME');

  // Render the correct page based on state
  const renderPage = () => {
    switch (page) {
      case 'HOME':
        return <HomePage />; // <-- REMOVED setPage
      case 'PATIENT_DETAILS':
        return <PatientDetailsPage />;
      case 'ONGOING_PATIENTS':
        return <OngoingPatientsPage />;
      default:
        return <HomePage />; // <-- REMOVED setPage
    }
  };

  return (
    <Layout page={page} setPage={setPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;