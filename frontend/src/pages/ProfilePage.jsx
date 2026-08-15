import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  User, 
  Flame, 
  Trophy, 
  Award, 
  Edit3, 
  Check, 
  LogOut, 
  Sparkles, 
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import { showToast } from '../components/Common/Toast';
import { Modal } from '../components/Common/Modal';

export const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const [profileStats, setProfileStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      setUsername(user.username);
      setBio(user.bio || '');
      setProfileImage(user.profile_image || '');
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${user.id}`);
      setProfileStats(res.data);
    } catch (err) {
      showToast('Failed to load profile stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await api.put(`/users/${user.id}`, {
        username: username.trim(),
        bio: bio.trim(),
        profile_image: profileImage
      });
      updateUser(res.data);
      showToast('Profile updated successfully!');
      setEditModalOpen(false);
      fetchUserProfile();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update profile', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const totalCompletions = profileStats?.total_completions || 0;
  const longestStreak = profileStats?.longest_streak_ever || 0;
  const totalFriends = user?.friends?.length || 0;

  // Gamification badges calculation
  const achievements = [
    {
      id: 'first_flame',
      title: 'First Flame',
      desc: 'Started tracking habits and logged 1st session',
      icon: '🔥',
      unlocked: totalCompletions >= 1,
      progress: Math.min(totalCompletions, 1) + '/1'
    },
    {
      id: 'seven_day',
      title: '7-Day Warrior',
      desc: 'Achieve a 7-day uninterrupted streak',
      icon: '⚡',
      unlocked: longestStreak >= 7,
      progress: Math.min(longestStreak, 7) + '/7 days'
    },
    {
      id: 'thirty_day',
      title: '30-Day Master',
      desc: 'Achieve a 30-day streak milestone',
      icon: '🏆',
      unlocked: longestStreak >= 30,
      progress: Math.min(longestStreak, 30) + '/30 days'
    },
    {
      id: 'social',
      title: 'Accountability Squad',
      desc: 'Connect with at least 3 friends for mutual support',
      icon: '👥',
      unlocked: totalFriends >= 3,
      progress: Math.min(totalFriends, 3) + '/3 friends'
    },
    {
      id: 'century',
      title: 'Century Club',
      desc: 'Log 100 total habit check-ins all-time',
      icon: '🌟',
      unlocked: totalCompletions >= 100,
      progress: Math.min(totalCompletions, 100) + '/100 check-ins'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Profile Header Card */}
      <div className="relative rounded-3xl p-6 sm:p-8 glass-panel border border-slate-800 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={user?.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
              alt={user?.username}
              className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-indigo-500/50 shadow-xl object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">@{user?.username}</h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  Active Member
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              <p className="text-sm text-slate-300 mt-2 max-w-md">
                {user?.bio || 'Building daily momentum one day at a time! 🚀'}
              </p>
            </div>
          </div>

          {/* Edit / Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 font-medium">Habits Tracked</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-['Outfit']">
            {profileStats?.total_streaks_tracked || 0}
          </div>
          <div className="text-[11px] text-indigo-400 mt-0.5">Active habits</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 font-medium">Total Check-ins</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-['Outfit']">
            {totalCompletions}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Completed sessions</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 font-medium">Longest Streak</div>
          <div className="text-2xl font-extrabold text-orange-400 mt-1 font-['Outfit']">
            {longestStreak} <span className="text-xs font-normal">days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Personal record</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
          <div className="text-xs text-slate-400 font-medium">Friends Circle</div>
          <div className="text-2xl font-extrabold text-purple-400 mt-1 font-['Outfit']">
            {totalFriends}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Accountability peers</div>
        </div>
      </div>

      {/* Gamification & Badges Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Achievements & Badges</span>
          </h3>
          <span className="text-xs text-slate-400">
            {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`glass-panel rounded-2xl p-5 border transition-all duration-200 ${
                ach.unlocked
                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-slate-900 to-slate-950 shadow-lg shadow-amber-500/5'
                  : 'border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    ach.unlocked
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  <span>{ach.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-white truncate">{ach.title}</h4>
                    {ach.unlocked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ach.desc}</p>
                  <div className="mt-2 text-[11px] text-slate-500 font-semibold">
                    Progress: {ach.progress}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Bio
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What are your habit goals?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Avatar Seed / Image URL
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://api.dicebear.com/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setProfileImage(`https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random().toString(36).substring(7)}`)}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap"
              >
                Randomize
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
            >
              {updating ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
