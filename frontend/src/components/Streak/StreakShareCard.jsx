import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Flame, Trophy, Copy, Check, Sparkles, Share2 } from 'lucide-react';
import { showToast } from '../Common/Toast';
import { useAuth } from '../../context/AuthContext';

export const StreakShareCard = ({ streak, isOpen, onClose }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !streak) return null;

  const act = streak.activity || {};
  const currentStreak = streak.current_streak || 0;
  const username = user?.username || 'Habit Champion';

  const shareText = `🔥 Milestone unlocked! I'm on a ${currentStreak}-day streak tracking "${act.name}" with Streaker! Consistency is key 🚀 #StreakTracker #HabitBuilding`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      showToast('Copied share text to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Streak Milestone" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Sharable Visual Card */}
        <div 
          className="relative rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border-2 border-indigo-500/40 shadow-2xl text-center overflow-hidden"
        >
          {/* Subtle glow background */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* User Badge */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <img
              src={user?.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
              alt={username}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-300">@{username}</span>
          </div>

          {/* Main Badge Graphic */}
          <div className="my-3 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-1 shadow-lg shadow-orange-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center">
              <Flame className="w-10 h-10 text-orange-400 fill-orange-400/40 animate-fire-flicker" />
            </div>
          </div>

          <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 font-['Outfit'] tracking-tight">
            {currentStreak} DAYS
          </div>
          <div className="text-xs font-bold text-orange-400/90 tracking-widest uppercase mt-0.5">
            Active Streak Flame
          </div>

          {/* Activity Title */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-sm font-bold text-white">{act.name}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{act.category}</div>
          </div>

          <div className="mt-4 text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Tracked with Streaker App</span>
          </div>
        </div>

        {/* Share Action */}
        <div className="pt-2">
          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Share Post'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
