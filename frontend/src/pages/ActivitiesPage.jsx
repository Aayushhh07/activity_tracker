import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ActivityCard } from '../components/Activity/ActivityCard';
import { ActivityDetailModal } from '../components/Activity/ActivityDetailModal';
import { Search, Plus, Sparkles, Filter } from 'lucide-react';
import { showToast } from '../components/Common/Toast';

const CATEGORIES = [
  'All',
  'Health & Fitness',
  'Learning & Education',
  'Creative & Hobbies',
  'Productivity',
  'Mindfulness & Wellness',
  'Social & Community',
  'Home & Environment',
  'Career & Professional'
];

export const ActivitiesPage = ({ onOpenCreateActivity }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [selectedCategory]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      const res = await api.get('/activities', { params });
      setActivities(res.data);
    } catch (err) {
      showToast('Failed to load activities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchActivities();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Discover & Join Habits
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse habits created by the community, track with friends, or launch your own.
          </p>
        </div>

        <button
          onClick={onOpenCreateActivity}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Habit</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search habits by name (e.g. run, read, meditate)..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Activities */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading activities...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center text-2xl">
            🔍
          </div>
          <h4 className="text-base font-bold text-white">No activities found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or create a brand new activity.
          </p>
          <button
            onClick={onOpenCreateActivity}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
          >
            Create Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              onUpdate={fetchActivities}
              onViewDetail={(id) => setSelectedActivityId(id)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedActivityId && (
        <ActivityDetailModal
          activityId={selectedActivityId}
          isOpen={!!selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
          onRefresh={fetchActivities}
        />
      )}
    </div>
  );
};
