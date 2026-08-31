import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar, AdminTab } from './components/Sidebar';
import { DashboardOverview } from './views/DashboardOverview';
import { PatientDetailView } from './views/PatientDetailView';
import { GeofenceMapView } from './views/GeofenceMapView';
import { PatientRecordsView } from './views/PatientRecordsView';
import { AlertCenterView } from './views/AlertCenterView';
import { OrgAnalyticsView } from './views/OrgAnalyticsView';
import { ConsentSecurityView } from './views/ConsentSecurityView';
import { LoginView } from './views/LoginView';
import { IngestionSimulatorModal } from './components/IngestionSimulatorModal';
import { api } from './api/client';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat_001');
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(3);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchAlertsCount = () => {
    api.getAlerts({ status: 'active' })
      .then(alerts => setActiveAlertsCount(alerts.length))
      .catch(console.error);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlertsCount();
      const interval = setInterval(fetchAlertsCount, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setActiveTab('scorecard');
  };

  const handleRefreshAll = () => {
    setRefreshKey(prev => prev + 1);
    fetchAlertsCount();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        activeAlertsCount={activeAlertsCount}
        onOpenSimulator={() => setShowSimulator(true)}
        onNavigateAlerts={() => setActiveTab('alerts')}
      />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Dynamic Content Panel */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              key={refreshKey}
              onSelectPatient={handleSelectPatient}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'roster' && (
            <DashboardOverview
              key={refreshKey}
              onSelectPatient={handleSelectPatient}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'scorecard' && (
            <PatientDetailView
              key={refreshKey}
              selectedPatientId={selectedPatientId}
              onBackToRoster={() => setActiveTab('overview')}
              onSelectPatient={setSelectedPatientId}
              onOpenRecordEditor={() => setActiveTab('records')}
            />
          )}

          {activeTab === 'geofence' && (
            <GeofenceMapView
              key={refreshKey}
              selectedPatientId={selectedPatientId}
              onSelectPatient={setSelectedPatientId}
            />
          )}

          {activeTab === 'records' && (
            <PatientRecordsView
              key={refreshKey}
              selectedPatientId={selectedPatientId}
              onSelectPatient={setSelectedPatientId}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertCenterView
              key={refreshKey}
              onRefreshAlertsCount={fetchAlertsCount}
            />
          )}

          {activeTab === 'analytics' && (
            <OrgAnalyticsView
              key={refreshKey}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {activeTab === 'security' && (
            <ConsentSecurityView
              key={refreshKey}
              onRefreshData={handleRefreshAll}
            />
          )}
        </main>
      </div>

      {/* Central Ingestion & Sync Simulator Modal */}
      <IngestionSimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
};
