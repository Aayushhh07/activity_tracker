import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Flame, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Users, 
  Plus, 
  Sparkles, 
  ChevronRight,
  Smile,
  Edit3,
  Award,
  ArrowRight
} from 'lucide-react';
import { showToast } from '../components/Common/Toast';
import { triggerQuickSuccess, triggerStreakConfetti } from '../utils/confetti';
import { LogEntryModal } from '../components/Streak/LogEntryModal';
import { StreakShareCard } from '../components/Streak/StreakShareCard';
import { ActivityDetailModal } from '../components/Activity/ActivityDetailModal';
import { ActivityCard } from '../components/Activity/ActivityCard';

export const DashboardPage = ({ onNavigate, onOpenCreateActivity }) => {
  const { user } = useAuth();
  const [todayActivities, setTodayActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [friendsFeed, setFriendsFeed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedStreakForLog, setSelectedStreakForLog] = useState(null);
  const [selectedStreakForShare, setSelectedStreakForShare] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [todayRes, summaryRes, friendsRes, trendingRes] = await Promise.all([
        api.get('/dashboard/today'),
        api.get('/dashboard/summary'),
        api.get('/dashboard/friends'),
        api.get('/activities/trending')
      ]);

      setTodayActivities(todayRes.data);
      setSummary(summaryRes.data);
      setFriendsFeed(friendsRes.data);
      setTrending(trendingRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckIn = async (item) => {
    try {
      const newStatus = !item.completed_today;
      const todayIso = new Date().toISOString().split('T')[0];

      await api.post(`/streaks/${item.streak_id}/log`, {
        completed: newStatus,
        date: todayIso
      });

      if (newStatus) {
        triggerStreakConfetti();
        showToast(`Streak checked in! (${item.current_streak + 1} days 🔥)`);
      } else {
        showToast(`Checked out for today`);
      }

      fetchDashboardData();
    } catch (err) {
      showToast('Failed to log activity', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading your daily dashboard...</span>
      </div>
    );
  }

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayDateFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.username || 'Champion'}! 🔥
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Consistency creates momentum. You've completed{' '}
              <strong className="text-emerald-400 font-bold">{summary?.completed_today_count || 0}</strong> of{' '}
              <strong className="text-white font-bold">{summary?.total_today_activities || 0}</strong> habits today.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shrink-0">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Flame className="w-7 h-7 text-orange-400 fill-orange-400/20 animate-fire-flicker" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Longest Streak</div>
              <div className="text-xl font-extrabold text-white font-['Outfit']">
                {summary?.longest_streak_across_all || 0} <span className="text-xs text-orange-400 font-semibold">days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Today's Progress</div>
            <div className="text-2xl font-bold text-white mt-1 font-['Outfit']">
              {summary?.today_progress_percent || 0}%
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
              {summary?.completed_today_count}/{summary?.total_today_activities} completed
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Streaks</div>
            <div className="text-2xl font-bold text-white mt-1 font-['Outfit']">
              {summary?.total_active_streaks || 0}
            </div>
            <div className="text-[11px] text-orange-400 mt-0.5 font-medium">
              Habits on fire 🔥
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">All-Time Check-ins</div>
            <div className="text-2xl font-bold text-white mt-1 font-['Outfit']">
              {summary?.total_completions_all_time || 0}
            </div>
            <div className="text-[11px] text-indigo-400 mt-0.5 font-medium">
              Total completions
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Best Day of Week</div>
            <div className="text-2xl font-bold text-white mt-1 font-['Outfit']">
              {summary?.best_day_of_week || 'Monday'}
            </div>
            <div className="text-[11px] text-teal-400 mt-0.5 font-medium">
              Peak consistency
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Action List + Friend Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Today's Overview & 1-Click Check-in */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Today's Habits & Quick Check-in</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                {todayActivities.length}
              </span>
            </h3>

            <button
              onClick={() => onNavigate('streaks')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All Streaks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayActivities.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center text-2xl">
                🌱
              </div>
              <h4 className="text-base font-bold text-white">No habits being tracked yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Start by creating your own habit or discover community streaks to begin building your momentum.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={onOpenCreateActivity}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Create Habit
                </button>
                <button
                  onClick={() => onNavigate('activities')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Browse Catalog
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayActivities.map((item) => (
                <div
                  key={item.streak_id}
                  className={`glass-panel rounded-2xl p-4 transition-all duration-200 border flex items-center justify-between gap-4 ${
                    item.completed_today
                      ? 'border-emerald-500/30 bg-slate-900/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ borderLeft: `4px solid ${item.color || '#6366F1'}` }}
                >
                  {/* Left: Icon + Title + Streak count */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${item.color || '#6366F1'}20` }}
                    >
                      <span>{item.icon || '🔥'}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold truncate ${item.completed_today ? 'text-slate-300 line-through' : 'text-white'}`}>
                          {item.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium shrink-0">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-orange-400">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{item.current_streak} day streak</span>
                        </span>
                        {item.today_mood && (
                          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                            Mood: {item.today_mood}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedStreakForLog({
                        id: item.streak_id,
                        activity: { name: item.name }
                      })}
                      title="Add note / mood"
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleQuickCheckIn(item)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                        item.completed_today
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${item.completed_today ? 'text-emerald-400' : 'text-white'}`} />
                      <span>{item.completed_today ? 'Done' : 'Check in'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trending Community Habits Preview */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Trending Community Habits</span>
              </h3>
              <button
                onClick={() => onNavigate('activities')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Browse All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trending.slice(0, 2).map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onUpdate={fetchDashboardData}
                  onViewDetail={(id) => setSelectedActivityId(id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Friend Accountability Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Friends Accountability</span>
            </h3>
            <button
              onClick={() => onNavigate('friends')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Manage
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-3">
            {friendsFeed.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent friend updates. Add friends to keep each other accountable!
              </div>
            ) : (
              friendsFeed.map((item, idx) => (
                <div
                  key={`${item.user_id}-${item.activity_id}-${idx}`}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900 transition-colors flex items-start gap-3"
                >
                  <img
                    src={item.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                    alt={item.username}
                    className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">@{item.username}</span>
                      {item.completed_today ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                          Completed ✅
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 shrink-0">In progress</span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                      {item.activity_icon} {item.activity_name}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        <span>{item.current_streak} days</span>
                      </span>
                      {item.notes && (
                        <span className="text-slate-400 truncate italic">
                          "{item.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedStreakForLog && (
        <LogEntryModal
          streak={selectedStreakForLog}
          isOpen={!!selectedStreakForLog}
          onClose={() => setSelectedStreakForLog(null)}
          onLogged={fetchDashboardData}
        />
      )}

      {selectedStreakForShare && (
        <StreakShareCard
          streak={selectedStreakForShare}
          isOpen={!!selectedStreakForShare}
          onClose={() => setSelectedStreakForShare(null)}
        />
      )}

      {selectedActivityId && (
        <ActivityDetailModal
          activityId={selectedActivityId}
          isOpen={!!selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
          onRefresh={fetchDashboardData}
        />
      )}
    </div>
  );
};
