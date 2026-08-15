import React from 'react';
import { format, parseISO } from 'date-fns';

const MOOD_EMOJIS = {
  great: '🤩',
  good: '😊',
  okay: '😐',
  bad: '😔'
};

export const CalendarHeatmap = ({ heatmapData = [], onSelectDate, streakColor = '#6366F1' }) => {
  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-slate-500">
        No log history available yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[10px]">60-Day Consistency Heatmap</span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>More</span>
        </div>
      </div>

      {/* Grid of 60 days */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-x-auto">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 justify-start">
          {heatmapData.map((item) => {
            const isCompleted = item.completed;
            const mood = item.mood;
            const emoji = mood ? MOOD_EMOJIS[mood] : null;

            return (
              <button
                type="button"
                key={item.date}
                onClick={() => onSelectDate && onSelectDate(item.date)}
                title={`${item.date}: ${isCompleted ? 'Completed' : 'Missed'}${mood ? ` (${mood})` : ''}${item.has_note ? ' 📝 Note attached' : ''}`}
                className={`w-3.5 h-3.5 rounded-sm transition-all relative group flex items-center justify-center ${
                  isCompleted
                    ? 'bg-emerald-500 hover:scale-125 shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-400/50'
                    : 'bg-slate-800/70 hover:bg-slate-700 border border-slate-700/40'
                }`}
                style={{
                  backgroundColor: isCompleted ? (streakColor || '#10B981') : undefined
                }}
              >
                {item.has_note && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-slate-500 text-right">Click any square to view or edit logs for that date</p>
    </div>
  );
};
