import React, { useState } from 'react';
import { Flame, Trophy, Check, Plus, Calendar, Share2, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../Common/Toast';
import { triggerQuickSuccess, triggerStreakConfetti } from '../../utils/confetti';
import { CalendarHeatmap } from './CalendarHeatmap';

export const StreakCard = ({ streak, onRefresh, onOpenLogModal, onOpenShareModal }) => {
  const [showStats, setShowStats] = useState(false);
  const [streakDetail, setStreakDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const act = streak.activity || {};
  const currentStreak = streak.current_streak || 0;
  const longestStreak = streak.longest_streak || 0;
  const isCompletedToday = streak.completed_today;

  const handleQuickToggle = async (e) => {
    e.stopPropagation();
    try {
      setToggleLoading(true);
      const newStatus = !isCompletedToday;
      const todayIso = new Date().toISOString().split('T')[0];

      await api.post(`/streaks/${streak.id}/log`, {
        completed: newStatus,
        date: todayIso
      });

      if (newStatus) {
        triggerStreakConfetti();
        showToast(`Day logged! Current streak: ${currentStreak + 1} 🔥`);
      } else {
        showToast('Logged as incomplete for today');
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      showToast('Failed to update streak status', 'error');
    } finally {
      setToggleLoading(false);
    }
  };

  const toggleStatsAccordion = async () => {
    if (!showStats && !streakDetail) {
      try {
        setLoadingDetail(true);
        const res = await api.get(`/streaks/${streak.id}`);
        setStreakDetail(res.data);
      } catch (err) {
        showToast('Failed to load streak history', 'error');
      } finally {
        setLoadingDetail(false);
      }
    }
    setShowStats(!showStats);
  };

  const handleUnfollow = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Stop tracking "${act.name}"?`)) return;

    try {
      await api.delete(`/streaks/${streak.id}`);
      showToast(`Removed "${act.name}"`);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast('Failed to remove streak', 'error');
    }
  };

  return (
    <div 
      className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-lg"
      style={{ borderLeft: `4px solid ${act.color || '#6366F1'}` }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Activity Icon & Info */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0"
            style={{ backgroundColor: `${act.color || '#6366F1'}20` }}
          >
            <span>{act.icon || '🔥'}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {act.category || 'Habit'}
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">{act.name}</h4>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenShareModal(streak)}
            title="Share Milestone"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleUnfollow}
            title="Delete / Unfollow"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Row: Big Streak Flame Counter */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-400 fill-orange-400/20 animate-fire-flicker" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white font-['Outfit']">{currentStreak}</span>
              <span className="text-xs text-slate-400 font-medium">days streak</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Best: {longestStreak} days</span>
            </div>
          </div>
        </div>

        {/* Quick Log Toggle */}
        <button
          onClick={handleQuickToggle}
          disabled={toggleLoading}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            isCompletedToday
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/20'
          }`}
        >
          {isCompletedToday ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Done Today</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Check In</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Actions: Log Reflection & Heatmap Toggle */}
      <div className="mt-3 flex items-center justify-between text-xs pt-2">
        <button
          onClick={() => onOpenLogModal(streak)}
          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Add Reflection & Mood</span>
        </button>

        <button
          onClick={toggleStatsAccordion}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 font-medium transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{showStats ? 'Hide History' : 'View Calendar'}</span>
        </button>
      </div>

      {/* Expandable Heatmap & Past Log Section */}
      {showStats && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
          {loadingDetail ? (
            <div className="py-4 text-center text-xs text-slate-400">Loading history...</div>
          ) : streakDetail ? (
            <>
              {/* Consistency percentage badge */}
              <div className="flex items-center justify-between text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Consistency Rate</span>
                <span className="font-bold text-emerald-400">{streakDetail.stats?.consistency_percentage || 0}%</span>
              </div>

              {/* 60-Day Heatmap */}
              <CalendarHeatmap
                heatmapData={streakDetail.stats?.monthly_heatmap}
                streakColor={act.color}
                onSelectDate={(date) => onOpenLogModal(streak, date)}
              />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
