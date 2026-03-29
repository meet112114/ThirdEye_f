import React, { useState, useEffect } from "react";
import SamuraiDashboard from "../components/SamuraiDashboard";
import { useMomentumData } from "./momentum/hooks/useMomentumData";
import api from "../api/axios";
import { format } from "date-fns";

export default function SamuraiPage() {
  const { data: momentumData, stats: momentumStats, isLoading: momentumLoading } = useMomentumData();
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [workoutLoading, setWorkoutLoading] = useState(true);

  useEffect(() => {
    api.get('/workout/logs').then(res => {
      setWorkoutLogs(res.data.logs || []);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setWorkoutLoading(false);
    });
  }, []);

  if (momentumLoading || workoutLoading) {
     return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a' }}>
           <div className="spinner"></div>
        </div>
     );
  }

  // Process data for today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  // Factor 1: Momentum Tasks Today
  let tasksToDoToday = 0;
  let tasksCompletedToday = 0;
  
  if (momentumData && momentumData.programs) {
    momentumData.programs.forEach(p => {
       const isApplicable = p.activeDays.includes(new Date().getDay());
       if (isApplicable) {
          tasksToDoToday++;
          const log = momentumData.logs.find(l => l.programId === p.id && l.date === todayStr);
          if (log && log.intensity > 0) {
             tasksCompletedToday += log.intensity;
          }
       }
    });
  }
  
  const dailyProgressScore = tasksToDoToday > 0 
    ? (tasksCompletedToday / tasksToDoToday) * 100 
    : (tasksCompletedToday > 0 ? 100 : 0);
  const fillDaily = tasksToDoToday > 0 
    ? Math.min(1, tasksCompletedToday / tasksToDoToday) 
    : (tasksCompletedToday > 0 ? 1 : 0);

  // Factor 2: Momentum Streaks Maintained
  let totalActiveStreaks = momentumStats?.activeStreakCount || 0;
  const maxPossibleStreaks = momentumStats?.programsWithStats?.length || 1;
  const streakScore = maxPossibleStreaks > 0 
    ? (totalActiveStreaks / maxPossibleStreaks) * 100 
    : 0;
  const fillStreak = maxPossibleStreaks > 0 
    ? Math.min(1, totalActiveStreaks / maxPossibleStreaks) 
    : 0;
  
  // Factor 3: Workout Intensity
  const todayWorkout = workoutLogs.find(l => l.date === todayStr);
  const workoutIntensity = todayWorkout ? (todayWorkout.intensity || 0) : 0;
  const workoutScore = (workoutIntensity / 5) * 100;
  const fillWorkout = workoutIntensity / 5;

  // Factor 4: Historical Completion (Inner Focus)
  const avgCompletion = momentumStats?.programsWithStats?.length > 0 
    ? momentumStats.programsWithStats.reduce((acc, p) => acc + p.stats.completionRate, 0) / momentumStats.programsWithStats.length
    : 0;
  const fillFocus = avgCompletion;
  
  // Compute Final Weighted Score out of 100
  // Weights: Daily tasks (35%), Streaks maintained (25%), Workout (25%), Overall Consistency (15%)
  let finalScore = (dailyProgressScore * 0.35) + (streakScore * 0.25) + (workoutScore * 0.25) + (avgCompletion * 100 * 0.15);
  finalScore = Math.round(finalScore);
  
  // Cap score between 0 and 100
  finalScore = Math.min(100, Math.max(0, finalScore));

  // Determine quotes based on score
  let quotes = { hero: "", philosophy: "" };
  if (finalScore < 20) {
     quotes.hero = "Even the longest journey begins with a single step.";
     quotes.philosophy = "A warrior's greatest battle is against his own excuses.";
  } else if (finalScore < 40) {
     quotes.hero = "You have unsheathed your blade. Now, find your focus.";
     quotes.philosophy = "Consistency is heavier than intensity, yet it builds the strongest foundation.";
  } else if (finalScore < 60) {
     quotes.hero = "The fire is kindled. Do not let the wind blow it out.";
     quotes.philosophy = "Discipline is remembering what you want most, not what you want now.";
  } else if (finalScore < 80) {
     quotes.hero = "Your strikes are true, your spirit is unyielding.";
     quotes.philosophy = "To conquer oneself is a greater task than conquering others.";
  } else {
     quotes.hero = "A master walks among us. The path is illuminated.";
     quotes.philosophy = "When the mind is a calm lake, it reflects the true nature of victory.";
  }

  return (
    <SamuraiDashboard
      score={finalScore}
      quotes={quotes}
      differentScores={{
        left: [
          { name: "Daily Momentum", icon: "⛩", sub: `${tasksCompletedToday > 0 ? tasksCompletedToday.toFixed(1) : 0}/${tasksToDoToday} Habits completed today`, fill: fillDaily },
          { name: "Physical Mastery", icon: "⚔", sub: `Workout intensity: ${workoutIntensity}/5`, fill: fillWorkout },
        ],
        right: [
          { name: "Unbroken Chains", icon: "🌸", sub: `${totalActiveStreaks} Active streaks maintained`, fill: fillStreak },
          { name: "Inner Focus", icon: "🏯", sub: "Historical completion rate", fill: fillFocus },
        ],
      }}
    />
  );
}