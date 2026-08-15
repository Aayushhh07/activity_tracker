import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Sparkles, Palette, Tag, Check, Lock, Globe } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../Common/Toast';

const CATEGORIES = [
  { name: 'Health & Fitness', icon: '🏃' },
  { name: 'Learning & Education', icon: '📚' },
  { name: 'Creative & Hobbies', icon: '🎨' },
  { name: 'Productivity', icon: '💻' },
  { name: 'Mindfulness & Wellness', icon: '🧘' },
  { name: 'Social & Community', icon: '👥' },
  { name: 'Home & Environment', icon: '🏠' },
  { name: 'Career & Professional', icon: '💼' }
];

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#14B8A6'  // Teal
];

const PRESET_ICONS = ['🔥', '🏃', '📚', '🧘', '💻', '💧', '🎨', '📝', '💪', '🌱', '⚡', '🎯', '🥑', '🚴', '🧠'];

export const ActivityFormModal = ({ isOpen, onClose, onActivityCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('🔥');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Activity name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/activities', {
        name: name.trim(),
        description: description.trim(),
        category,
        color,
        icon,
        is_public: isPublic
      });
      showToast(`Created activity "${name}" successfully!`);
      setName('');
      setDescription('');
      onActivityCreated(res.data);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create activity', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Habit Activity">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Activity Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 10,000 Steps Daily, 30min Reading"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is the daily goal or criteria for this streak?"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              const found = CATEGORIES.find(c => c.name === e.target.value);
              if (found) setIcon(found.icon);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Emoji Icon Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Icon Emoji
          </label>
          <div className="flex flex-wrap gap-2 p-2 bg-slate-900/70 border border-slate-800 rounded-xl">
            {PRESET_ICONS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  icon === emoji
                    ? 'bg-indigo-600/30 border-2 border-indigo-400 scale-110'
                    : 'hover:bg-slate-800'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Color Accent
          </label>
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                  color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Switch */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5">
            {isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {isPublic ? 'Public Activity' : 'Private (Only Me)'}
              </div>
              <div className="text-[11px] text-slate-400">
                {isPublic ? 'Discoverable by community & friends' : 'Only visible to your account'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              isPublic ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            {loading ? 'Creating...' : 'Create & Track Habit'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
