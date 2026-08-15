import React, { useState } from 'react';
import { Users, Check, Plus, ArrowUpRight, Flame, Globe, Lock } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../Common/Toast';
import { triggerQuickSuccess } from '../../utils/confetti';

export const ActivityCard = ({ activity, onUpdate, onViewDetail }) => {
  const [joining, setJoining] = useState(false);

  const handleToggleTrack = async (e) => {
    e.stopPropagation();
    if (activity.is_tracking) {
      // User is already tracking; open details or confirm unfollow
      if (activity.user_streak_id) {
        onViewDetail(activity.id);
      }
      return;
    }

    try {
      setJoining(true);
      await api.post('/streaks', { activity_id: activity.id });
      triggerQuickSuccess();
      showToast(`Joined habit "${activity.name}"!`);
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to join activity', 'error');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      onClick={() => onViewDetail(activity.id)}
      className="group relative glass-panel rounded-2xl p-5 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
      style={{
        borderTop: `3px solid ${activity.color || '#6366F1'}`
      }}
    >
      <div>
        {/* Header: Icon + Category + Privacy */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0"
            style={{ backgroundColor: `${activity.color || '#6366F1'}20` }}
          >
            <span>{activity.icon || '🔥'}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/50">
              {activity.category}
            </span>
            {!activity.is_public && (
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Private">
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
          {activity.name}
        </h4>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {activity.description || 'Daily streak habit to stay consistent and level up.'}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>{activity.tracking_count || 0} tracking</span>
        </div>

        {activity.is_tracking ? (
          <button
            onClick={handleToggleTrack}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tracking</span>
          </button>
        ) : (
          <button
            onClick={handleToggleTrack}
            disabled={joining}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{joining ? 'Joining...' : 'Track Streak'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
