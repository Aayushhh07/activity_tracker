import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Check, Smile, Meh, Frown, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../Common/Toast';
import { triggerStreakConfetti } from '../../utils/confetti';

const MOODS = [
  { id: 'great', label: 'Great', emoji: '🤩', color: 'border-emerald-500 bg-emerald-500/15 text-emerald-300' },
  { id: 'good', label: 'Good', emoji: '😊', color: 'border-indigo-500 bg-indigo-500/15 text-indigo-300' },
  { id: 'okay', label: 'Okay', emoji: '😐', color: 'border-amber-500 bg-amber-500/15 text-amber-300' },
  { id: 'bad', label: 'Tough', emoji: '😔', color: 'border-rose-500 bg-rose-500/15 text-rose-300' }
];

export const LogEntryModal = ({ streak, dateStr, isOpen, onClose, onLogged }) => {
  const [completed, setCompleted] = useState(true);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('good');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && streak) {
      const todayIso = new Date().toISOString().split('T')[0];
      const selectedDate = dateStr || todayIso;
      setTargetDate(selectedDate);

      // Find existing log for this date if any
      const existing = streak.logs?.find(l => String(l.date).slice(0, 10) === selectedDate);
      if (existing) {
        setCompleted(existing.completed);
        setNotes(existing.notes || '');
        setMood(existing.mood || 'good');
      } else {
        setCompleted(true);
        setNotes('');
        setMood('good');
      }
    }
  }, [isOpen, streak, dateStr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!streak) return;

    try {
      setLoading(true);
      const res = await api.post(`/streaks/${streak.id}/log`, {
        completed,
        notes: notes.trim(),
        mood,
        date: targetDate
      });

      if (completed) {
        triggerStreakConfetti();
        showToast(`Streak logged! Current streak: ${res.data.current_streak} days 🔥`);
      } else {
        showToast(`Log saved for ${targetDate}`);
      }

      if (onLogged) onLogged(res.data);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save daily log', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !streak) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Daily Log: ${streak.activity?.name || 'Habit'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Date</span>
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Completion Toggle */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
              completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              {completed ? '🔥' : '⏸️'}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {completed ? 'Mark as Completed' : 'Mark as Skipped / Incomplete'}
              </div>
              <div className="text-xs text-slate-400">
                {completed ? 'Extends your active streak' : 'Will pause consecutive streak count'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCompleted(!completed)}
            className={`w-12 h-7 rounded-full transition-colors relative p-0.5 ${
              completed ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                completed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Mood Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            How was your session? (Mood)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  mood === m.id
                    ? `${m.color} border-2 shadow-lg`
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[11px] font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Reflection / Notes
            </label>
            <span className="text-[10px] text-slate-500">{notes.length}/500</span>
          </div>
          <textarea
            rows="3"
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What went well today? Any insights or milestones achieved?"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Saving...' : 'Save Daily Log'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
