import { useState } from 'react';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';
import Disclaimer from './components/Disclaimer';
import BackupPage from './features/backup/BackupPage';
import DosageCalculatorPage from './features/dosage/DosageCalculatorPage';
import HomePage from './features/home/HomePage';
import { deleteEntriesForProfile } from './features/logs/entryStorage';
import type { Entry } from './features/logs/entryTypes';
import GrowthChartPage from './features/growth/GrowthChartPage';
import GrowthLogPage from './features/logs/growth/GrowthLogPage';
import MedicalHistoryPage from './features/logs/history/MedicalHistoryPage';
import MedicineLogPage from './features/logs/medicine/MedicineLogPage';
import SicknessLogPage from './features/logs/sickness/SicknessLogPage';
import TemperatureLogPage from './features/logs/temperature/TemperatureLogPage';
import ProfileSheet from './features/profiles/ProfileSheet';
import { useProfiles } from './features/profiles/useProfiles';
import ReportsPage from './features/reports/ReportsPage';
import { useHashRoute } from './hooks/useHashRoute';
import type { Route } from './routes';

export default function App() {
  const [route, navigate] = useHashRoute();
  const { profiles, activeProfile, saveProfile, deleteProfile, selectProfile, reloadProfiles } =
    useProfiles();
  const [profilesOpen, setProfilesOpen] = useState(false);
  // Entry that Reports asked a log page to open for editing.
  const [editEntryId, setEditEntryId] = useState<string | null>(null);

  const openProfiles = () => setProfilesOpen(true);

  const goTo = (next: Route) => {
    setEditEntryId(null);
    navigate(next);
  };

  // Entry types and their log-page routes share the same names.
  const editFromReports = (entry: Entry) => {
    setEditEntryId(entry.id);
    navigate(entry.type);
  };

  const logPageProps = {
    profile: activeProfile,
    onBack: () => goTo('home'),
    onOpenProfiles: openProfiles,
    editEntryId,
    // After an edit that started in Reports, go back there.
    onEditDone: () => goTo('reports'),
  };

  const handleDeleteProfile = (id: string) => {
    deleteEntriesForProfile(id);
    deleteProfile(id);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col">
      <AppHeader activeProfile={activeProfile} onOpenProfiles={openProfiles} />

      <main className="flex-1 px-4 pt-1.5 md:px-6">
        {route === 'home' && <HomePage onNavigate={goTo} />}
        {route === 'calculator' && (
          <DosageCalculatorPage
            // Remount when the profile changes so the weight field starts from that profile.
            key={activeProfile?.id ?? 'no-profile'}
            profile={activeProfile}
            onSaveProfile={saveProfile}
            onBack={() => goTo('home')}
          />
        )}
        {route === 'medicine' && <MedicineLogPage {...logPageProps} onSaveProfile={saveProfile} />}
        {route === 'temperature' && <TemperatureLogPage {...logPageProps} />}
        {route === 'sickness' && <SicknessLogPage {...logPageProps} />}
        {route === 'growth' && (
          <GrowthLogPage
            {...logPageProps}
            onSaveProfile={saveProfile}
            onOpenChart={() => goTo('growth-chart')}
          />
        )}
        {route === 'growth-chart' && (
          <GrowthChartPage
            profile={activeProfile}
            onBack={() => goTo('growth')}
            onOpenProfiles={openProfiles}
          />
        )}
        {route === 'history' && <MedicalHistoryPage {...logPageProps} />}
        {route === 'backup' && <BackupPage onBack={() => goTo('home')} onRestored={reloadProfiles} />}
        {route === 'reports' && (
          <ReportsPage
            profile={activeProfile}
            onOpenProfiles={openProfiles}
            onEditEntry={editFromReports}
          />
        )}
      </main>
      <Disclaimer />

      <BottomNav route={route} onNavigate={goTo} />

      {profilesOpen && (
        <ProfileSheet
          profiles={profiles}
          activeId={activeProfile?.id ?? null}
          onSelect={selectProfile}
          onSave={saveProfile}
          onDelete={handleDeleteProfile}
          onClose={() => setProfilesOpen(false)}
        />
      )}
    </div>
  );
}
