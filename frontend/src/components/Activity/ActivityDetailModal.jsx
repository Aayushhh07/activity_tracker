import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Users, Flame, Trophy, Calendar, Check, Plus, Trash2, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../Common/Toast';
import { triggerQuickSuccess } from '../../utils/confetti';
import { useAuth } from '../../context/AuthContext';

export const ActivityDetailModal = ({ activityId, isOpen, onClose, onRefresh }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Message Board State
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'board'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (isOpen && activityId) {
      fetchDetail();
      // Reset tab when modal opens
      setActiveTab('leaderboard');
      setMessages([]);
    }
  }, [isOpen, activityId]);

  useEffect(() => {
    if (isOpen && activityId && activeTab === 'board') {
      fetchMessages();
    }
  }, [isOpen, activityId, activeTab]);

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/activities/${activityId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setActionLoading(true);
      await api.post(`/activities/${activityId}/messages`, { message: newMessage.trim() });
      setNewMessage('');
      await fetchMessages();
      showToast('Note posted to the shared board! 📝');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to post note', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/activities/${activityId}`);
      setData(res.data);
    } catch (err) {
      showToast('Failed to load activity details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      await api.post('/streaks', { activity_id: activityId });
      triggerQuickSuccess();
      showToast(`Now tracking "${data.name}"!`);
      await fetchDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to join', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!data.user_streak_id) return;
    if (!window.confirm(`Stop tracking "${data.name}"? Your streak history will be cleared.`)) return;

    try {
      setActionLoading(true);
      await api.delete(`/streaks/${data.user_streak_id}`);
      showToast(`Stopped tracking "${data.name}"`);
      await fetchDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast('Failed to stop tracking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data ? data.name : 'Activity Details'} maxWidth="max-w-xl">
      {loading ? (
        <div className="py-12 flex justify-center text-slate-400 text-sm">
          Loading details...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0"
              style={{ backgroundColor: `${data.color || '#6366F1'}25` }}
            >
              <span>{data.icon || '🔥'}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {data.category}
                </span>
                <span className="text-xs text-slate-400">
                  by {data.creator_username || 'Community'}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {data.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Trackers</span>
              </div>
              <div className="text-lg font-bold text-white">{data.tracking_count || 0}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1 text-orange-400 text-xs mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Top Streak</span>
              </div>
              <div className="text-lg font-bold text-orange-400">{data.longest_active_streak || 0} days</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-400 text-xs mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Avg Streak</span>
              </div>
              <div className="text-lg font-bold text-indigo-300">{data.average_streak || 0}d</div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              type="button"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Habit Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('board')}
              type="button"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'board'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Shared Message Board</span>
              {messages.length > 0 && (
                <span className="bg-indigo-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                  {messages.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'leaderboard' ? (
            /* Participants Community Leaderboard */
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Community Trackers & Accountability</span>
                <span className="text-[11px] text-slate-500 font-normal">{data.participants?.length || 0} users</span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {data.participants && data.participants.length > 0 ? (
                  data.participants.map((p) => (
                    <div
                      key={p.user_id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`}
                          alt={p.username}
                          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-white">{p.username}</span>
                            {p.is_friend && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Friend
                              </span>
                            )}
                            {user && p.user_id === user.id && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                            <span className="flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-orange-400" />
                              <span>{p.current_streak} day streak</span>
                            </span>
                            {p.today_mood && (
                              <span className="text-[10px] px-1 bg-slate-800 text-slate-300 rounded font-medium">
                                {p.today_mood === 'great' ? '🤩 Great' : p.today_mood === 'good' ? '😊 Good' : p.today_mood === 'okay' ? '😐 Okay' : '😔 Tough'}
                              </span>
                            )}
                          </div>
                          {p.today_note && (
                            <p className="text-[11px] text-slate-400 italic mt-1 bg-slate-950/40 px-2.5 py-1 rounded border border-slate-800/80 max-w-sm">
                              "{p.today_note}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        {p.completed_today ? (
                          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" />
                            <span>Done today</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 px-2 py-1">
                            Not yet today
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No trackers yet. Be the first to start this streak!
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Shared Message Board Tab */
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Habit Reflections & Group Notes</span>
                <span className="text-[11px] text-slate-500 font-normal">{messages.length} messages</span>
              </h4>

              {/* Messages list */}
              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-900">
                {loadingMessages ? (
                  <div className="py-8 text-center text-xs text-slate-500">Loading notes...</div>
                ) : messages.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-400">No board messages yet.</p>
                    <p className="text-[10px] text-slate-500">Be the first to share your progress, tips, or encouraging words!</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex gap-3 align-start"
                    >
                      <img
                        src={m.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.username}`}
                        alt={m.username}
                        className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-200">@{m.username}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap font-normal">
                          {m.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Post Note Form */}
              {data.is_tracking ? (
                <form onSubmit={handlePostMessage} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    required
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Post a tip, note, or message to the board..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || actionLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    Post Note
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                  🔒 You must join/track this activity to post notes on the shared board.
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {data.is_tracking ? (
              <>
                <button
                  onClick={handleUnfollow}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Stop Tracking</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Active on Dashboard
                  </span>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{actionLoading ? 'Joining...' : 'Join Activity & Track'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
