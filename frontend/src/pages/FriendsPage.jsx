import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Flame, CheckCircle2, UserMinus, Sparkles } from 'lucide-react';
import { UserSearchModal } from '../components/Social/UserSearchModal';
import { showToast } from '../components/Common/Toast';

export const FriendsPage = () => {
  const { user, updateUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendsFeed, setFriendsFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    fetchFriendsData();
  }, [user]);

  const fetchFriendsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [friendsRes, feedRes] = await Promise.all([
        api.get(`/users/${user.id}/friends`),
        api.get('/dashboard/friends')
      ]);
      setFriends(friendsRes.data);
      setFriendsFeed(feedRes.data);
    } catch (err) {
      showToast('Failed to load friends', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId, username) => {
    if (!window.confirm(`Remove @${username} from friends?`)) return;

    try {
      const res = await api.delete(`/users/${friendId}/friends`);
      updateUser(res.data);
      showToast(`Removed @${username}`);
      fetchFriendsData();
    } catch (err) {
      showToast('Failed to remove friend', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Friends & Social Accountability
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Habits are 2x more sticky when shared. Track progress and keep each other inspired.
          </p>
        </div>

        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Find & Add Friends</span>
        </button>
      </div>

      {/* Main Grid: Friends Grid + Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Friends Accountability Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>My Accountability Circle ({friends.length})</span>
          </h3>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading friends...</span>
            </div>
          ) : friends.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center text-2xl">
                👥
              </div>
              <h4 className="text-base font-bold text-white">No friends connected yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Search for fellow habit builders like <span className="text-indigo-300 font-semibold">@alex_runner</span> or <span className="text-indigo-300 font-semibold">@sarah_code</span> to see their streaks!
              </p>
              <button
                onClick={() => setSearchModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                Search Users
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.map((f) => {
                const finishedAll = f.total_today_activities > 0 && f.completed_today_count === f.total_today_activities;
                return (
                  <div
                    key={f.id}
                    className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={f.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                            alt={f.username}
                            className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white">@{f.username}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{f.bio || 'Building daily momentum'}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFriend(f.id, f.username)}
                          title="Remove Friend"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-medium">Active Streaks</div>
                          <div className="text-base font-bold text-orange-400 flex items-center justify-center gap-1 mt-0.5">
                            <Flame className="w-3.5 h-3.5" />
                            <span>{f.active_streaks_count}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-medium">Today's Progress</div>
                          <div className="text-base font-bold text-emerald-400 mt-0.5">
                            {f.completed_today_count}/{f.total_today_activities}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Today Accountability Status Badge */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Accountability:</span>
                      {finishedAll ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>All done today! 🎉</span>
                        </span>
                      ) : f.completed_today_count > 0 ? (
                        <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          In progress ({f.completed_today_count} done)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Not checked in yet today
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Activity Stream */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Community Stream</span>
          </h3>

          <div className="glass-panel rounded-2xl p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {friendsFeed.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No recent activity stream. Check back as friends log their habits!
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
                      <span className="text-[10px] text-slate-400">
                        {item.completed_today ? '✅ Completed' : 'Tracked'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium mt-0.5">
                      {item.activity_icon} {item.activity_name}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        <span>{item.current_streak} days streak</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onFriendUpdated={fetchFriendsData}
      />
    </div>
  );
};
