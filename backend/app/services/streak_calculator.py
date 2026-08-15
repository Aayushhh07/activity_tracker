from datetime import datetime, date, timedelta
from typing import List, Dict, Tuple, Optional
from app.models.streak import StreakStats, LogEntry

def parse_date(d_str: str) -> date:
    """Parses YYYY-MM-DD string into date object"""
    return datetime.strptime(d_str[:10], "%Y-%m-%d").date()

def get_today_str() -> str:
    """Returns today's date formatted as YYYY-MM-DD"""
    return date.today().isoformat()

def calculate_streaks(logs: List[dict], today: Optional[date] = None) -> Tuple[int, int, Optional[str]]:
    """
    Calculates (current_streak, longest_streak, last_logged_date)
    given the full list of log dictionaries.
    """
    if not logs:
        return 0, 0, None
    
    if today is None:
        today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Filter completed logs and extract unique dates sorted ascending
    completed_dates = set()
    latest_date_str = None
    
    # Sort logs by date to find latest
    sorted_all_logs = sorted(logs, key=lambda x: str(x.get("date", ""))[:10])
    if sorted_all_logs:
        latest_date_str = str(sorted_all_logs[-1].get("date", ""))[:10]
    
    for l in logs:
        if l.get("completed", False):
            try:
                d = parse_date(str(l["date"]))
                completed_dates.add(d)
            except Exception:
                continue
                
    if not completed_dates:
        return 0, 0, latest_date_str

    sorted_dates = sorted(list(completed_dates))
    
    # Calculate all consecutive runs
    runs = []
    current_run = [sorted_dates[0]]
    
    for i in range(1, len(sorted_dates)):
        prev = sorted_dates[i-1]
        curr = sorted_dates[i]
        if (curr - prev).days == 1:
            current_run.append(curr)
        elif (curr - prev).days > 1:
            runs.append(current_run)
            current_run = [curr]
    runs.append(current_run)
    
    # Longest streak is the max length of any consecutive run
    longest_streak = max(len(r) for r in runs)
    
    # Current streak calculation:
    # Look at the very last run
    last_run = runs[-1]
    last_run_end = last_run[-1]
    
    if last_run_end == today:
        current_streak = len(last_run)
    elif last_run_end == yesterday:
        current_streak = len(last_run)
    else:
        current_streak = 0
        
    return current_streak, longest_streak, latest_date_str

def calculate_streak_stats(logs: List[dict], current_streak: int, longest_streak: int) -> StreakStats:
    """Calculates comprehensive statistics for a streak"""
    total_logs = len(logs)
    if total_logs == 0:
        return StreakStats(
            total_days_logged=0,
            total_completed_days=0,
            consistency_percentage=0.0,
            best_day_of_week="None",
            current_streak=current_streak,
            longest_streak=longest_streak,
            weekly_completion=[],
            monthly_heatmap=[]
        )
        
    completed_logs = [l for l in logs if l.get("completed", False)]
    total_completed = len(completed_logs)
    consistency = round((total_completed / total_logs) * 100, 1) if total_logs > 0 else 0.0
    
    # Best day of week
    day_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    for l in completed_logs:
        try:
            d = parse_date(str(l["date"]))
            day_counts[d.weekday()] += 1
        except Exception:
            continue
            
    best_day_idx = max(day_counts, key=day_counts.get)
    best_day_name = day_names[best_day_idx] if sum(day_counts.values()) > 0 else "None"
    
    # Past 7 days weekly completion
    today = date.today()
    weekly_completion = []
    logs_by_date = {str(l.get("date", ""))[:10]: l.get("completed", False) for l in logs}
    
    for i in range(6, -1, -1):
        target_d = today - timedelta(days=i)
        d_str = target_d.isoformat()
        day_label = target_d.strftime("%a") # e.g. Mon, Tue
        weekly_completion.append({
            "date": d_str,
            "day": day_label,
            "completed": logs_by_date.get(d_str, False),
            "is_today": (target_d == today)
        })
        
    # Past 60 days monthly heatmap
    monthly_heatmap = []
    mood_by_date = {str(l.get("date", ""))[:10]: l.get("mood") for l in logs}
    note_by_date = {str(l.get("date", ""))[:10]: l.get("notes", "") for l in logs}
    
    for i in range(59, -1, -1):
        target_d = today - timedelta(days=i)
        d_str = target_d.isoformat()
        is_comp = logs_by_date.get(d_str, False)
        monthly_heatmap.append({
            "date": d_str,
            "completed": is_comp,
            "count": 1 if is_comp else 0,
            "mood": mood_by_date.get(d_str),
            "has_note": bool(note_by_date.get(d_str))
        })
        
    return StreakStats(
        total_days_logged=total_logs,
        total_completed_days=total_completed,
        consistency_percentage=consistency,
        best_day_of_week=best_day_name,
        current_streak=current_streak,
        longest_streak=longest_streak,
        weekly_completion=weekly_completion,
        monthly_heatmap=monthly_heatmap
    )
