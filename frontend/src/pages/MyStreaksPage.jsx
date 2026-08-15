import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { StreakCard } from '../components/Streak/StreakCard';
import { LogEntryModal } from '../components/Streak/LogEntryModal';
import { StreakShareCard } from '../components/Streak/StreakShareCard';
import { Flame, Download, Plus, Sparkles, Filter } from 'lucide-react';
import { showToast } from '../components/Common/Toast';

export const MyStreaksPage = ({ onNavigate, onOpenCreateActivity }) => {
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed_today'

  // Modals
  const [selectedStreakForLog, setSelectedStreakForLog] = useState(null);
  const [selectedDateForLog, setSelectedDateForLog] = useState(null);
  const [selectedStreakForShare, setSelectedStreakForShare] = useState(null);

  useEffect(() => {
    fetchStreaks();
  }, []);

  const fetchStreaks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/streaks');
      setStreaks(res.data);
    } catch (err) {
      showToast('Failed to load streaks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogModal = (streak, dateStr = null) => {
    setSelectedStreakForLog(streak);
    setSelectedDateForLog(dateStr);
  };

  // Export streaks history to CSV
  const handleExportCSV = async () => {
    try {
      if (streaks.length === 0) {
        showToast('No streak data to export', 'error');
        return;
      }

      let csvContent = 'data:text/csv;charset=utf-8,Activity,Current Streak,Longest Streak,Total Logs,Last Logged Date\n';

      streaks.forEach((s) => {
        const actName = s.activity?.name ? `"${s.activity.name}"` : 'Habit';
        const current = s.current_streak || 0;
        const longest = s.longest_streak || 0;
        const totalLogs = s.logs?.length || 0;
        const lastDate = s.last_logged_date || 'N/A';
        csvContent += `${actName},${current},${longest},${totalLogs},${lastDate}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `streaker_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Exported streaks data to CSV!');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  const filteredStreaks = streaks.filter((s) => {
    if (filter === 'active') return (s.current_streak || 0) > 0;
    if (filter === 'completed_today') return s.completed_today;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Daily Streaks
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily momentum, log session reflections, and inspect consistency heatmaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCreateActivity}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Tracked ({streaks.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'active'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Streaks ({streaks.filter(s => (s.current_streak || 0) > 0).length})
        </button>
        <button
          onClick={() => setFilter('completed_today')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'completed_today'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Completed Today ({streaks.filter(s => s.completed_today).length})
        </button>
      </div>

      {/* Streaks List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading your streaks...</span>
        </div>
      ) : filteredStreaks.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 mx-auto flex items-center justify-center text-2xl">
            🔥
          </div>
          <h4 className="text-base font-bold text-white">No streaks match this filter</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === 'all'
              ? 'You have not joined any habits yet. Start tracking to build your streak history.'
              : 'Try changing the filter tab above.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => onNavigate('activities')}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Browse Habits
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredStreaks.map((streak) => (
            <StreakCard
              key={streak.id}
              streak={streak}
              onRefresh={fetchStreaks}
              onOpenLogModal={(s, d) => handleOpenLogModal(s, d)}
              onOpenShareModal={(s) => setSelectedStreakForShare(s)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedStreakForLog && (
        <LogEntryModal
          streak={selectedStreakForLog}
          dateStr={selectedDateForLog}
          isOpen={!!selectedStreakForLog}
          onClose={() => {
            setSelectedStreakForLog(null);
            setSelectedDateForLog(null);
          }}
          onLogged={fetchStreaks}
        />
      )}

      {selectedStreakForShare && (
        <StreakShareCard
          streak={selectedStreakForShare}
          isOpen={!!selectedStreakForShare}
          onClose={() => setSelectedStreakForShare(null)}
        />
      )}
    </div>
  );
};
