import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Search, UserPlus, UserCheck, Flame, Users } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../Common/Toast';
import { useAuth } from '../../context/AuthContext';

export const UserSearchModal = ({ isOpen, onClose, onFriendUpdated }) => {
  const { user, updateUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const res = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
      setResults(res.data);
    } catch (err) {
      showToast('User search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFriend = async (targetUser) => {
    const isFriend = user?.friends?.includes(targetUser.id);
    try {
      if (isFriend) {
        const res = await api.delete(`/users/${targetUser.id}/friends`);
        updateUser(res.data);
        showToast(`Removed @${targetUser.username} from friends`);
      } else {
        const res = await api.post(`/users/${targetUser.id}/friends`);
        updateUser(res.data);
        showToast(`Added @${targetUser.username} as friend!`);
      }
      if (onFriendUpdated) onFriendUpdated();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Friend action failed', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Find & Add Friends">
      <div className="space-y-4">
        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username (e.g. alex, sarah, maya)..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>

        {/* Results List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((u) => {
            const isFriend = user?.friends?.includes(u.id);
            return (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                    alt={u.username}
                    className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">@{u.username}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{u.bio || 'Habit builder'}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleFriend(u)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isFriend
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {isFriend ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Friends</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {results.length === 0 && query && !loading && (
            <div className="py-6 text-center text-xs text-slate-500">
              No users found matching "{query}"
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
