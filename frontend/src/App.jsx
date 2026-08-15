import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Common/Navbar';
import { ToastContainer } from './components/Common/Toast';
import { ActivityFormModal } from './components/Activity/ActivityFormModal';
import { DashboardPage } from './pages/DashboardPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { MyStreaksPage } from './pages/MyStreaksPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold tracking-wide">Starting Streaker...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
        {authView === 'login' ? (
          <LoginPage onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
        )}
        <ToastContainer />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950 text-slate-100 flex flex-col">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreateActivity={() => setCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <DashboardPage
            onNavigate={setCurrentTab}
            onOpenCreateActivity={() => setCreateModalOpen(true)}
          />
        )}
        {currentTab === 'activities' && (
          <ActivitiesPage
            onOpenCreateActivity={() => setCreateModalOpen(true)}
          />
        )}
        {currentTab === 'streaks' && (
          <MyStreaksPage
            onNavigate={setCurrentTab}
            onOpenCreateActivity={() => setCreateModalOpen(true)}
          />
        )}
        {currentTab === 'friends' && <FriendsPage />}
        {currentTab === 'profile' && <ProfilePage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>Streaker Activity Tracker • Built with React, FastAPI & MongoDB • Stay consistent daily 🔥</p>
      </footer>

      {/* Global Activity Creator Modal */}
      <ActivityFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onActivityCreated={() => {
          setCurrentTab('streaks');
        }}
      />

      <ToastContainer />
    </div>
  );
}
