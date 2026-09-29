import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { Overview } from './pages/Overview';
import { EntityRisk } from './pages/EntityRisk';
import { FindingsExplorer } from './pages/FindingsExplorer';
import { PriorityQueue } from './pages/PriorityQueue';
import { PeerComparison } from './pages/PeerComparison';
import { Reports } from './pages/Reports';
import { DataUpload } from './pages/DataUpload';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { DevicesList } from './pages/DevicesList';
import { AuthPage } from './pages/AuthPage';
import { RegulatoryCompliance } from './pages/RegulatoryCompliance';
import { RemediationWorkflow } from './pages/RemediationWorkflow';

const PageRenderer: React.FC = () => {
  const { activePage } = useApp();

  switch (activePage) {
    case 'overview':
      return <Overview />;
    case 'entity-risk':
      return <EntityRisk />;
    case 'findings':
      return <FindingsExplorer />;
    case 'compliance':
      return <RegulatoryCompliance />;
    case 'remediation':
      return <RemediationWorkflow />;
    case 'priority-queue':
      return <PriorityQueue />;
    case 'peer-comparison':
      return <PeerComparison />;
    case 'devices':
      return <DevicesList />;
    case 'reports':
      return <Reports />;
    case 'upload':
      return <DataUpload />;
    case 'audit-logs':
      return <AuditLogs />;
    case 'settings':
      return <Settings />;
    case 'auth':
      return <AuthPage />;
    default:
      return <Overview />;
  }
};

const MainApp: React.FC = () => {
  const { currentUser, isStationLocked } = useApp();

  if (isStationLocked || !currentUser?.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <AuthPage />
      </div>
    );
  }

  return (
    <Layout>
      <PageRenderer />
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
