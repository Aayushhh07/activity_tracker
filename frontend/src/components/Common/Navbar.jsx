import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Flame, 
  LayoutDashboard, 
  Compass, 
  Zap, 
  Users, 
  User, 
  LogOut, 
  Plus, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

export const Navbar = ({ currentTab, onSelectTab, onOpenCreateActivity }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'activities', label: 'Discover', icon: Compass },
    { id: 'streaks', label: 'My Streaks', icon: Zap },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400/30 animate-fire-flicker" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 tracking-tight font-['Outfit']">
                Streaker
              </span>
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md">
                PRO
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Profile */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenCreateActivity}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Activity</span>
            </button>

            {user && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-900 transition-colors"
                >
                  <img
                    src={user.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 object-cover"
                  />
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold text-slate-200">{user.username}</div>
                    <div className="text-[10px] text-emerald-400 font-medium">● Online</div>
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenCreateActivity}
              className="p-2 rounded-lg bg-indigo-600 text-white"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          {user && (
            <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.profile_image}
                  alt={user.username}
                  className="w-8 h-8 rounded-lg bg-slate-800"
                />
                <span className="text-sm font-medium text-slate-200">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
