import { ModelStats } from './gameLogic';

// Initialize stats from localStorage or create new ones
export const initializeStats = (name: string): ModelStats => {
  const savedStats = localStorage.getItem(`model_stats_${name}`);
  if (savedStats) {
    return JSON.parse(savedStats);
  }
  
  return {
    name,
    wins: 0,
    losses: 0,
    draws: 0,
    invalidMoves: 0,
    timeouts: 0,
    crashes: 0,
    totalMoves: 0,
    totalTime: 0,
    averageTime: 0
  };
};

// Save stats to localStorage
export const saveStats = (name: string, stats: ModelStats) => {
  localStorage.setItem(`model_stats_${name}`, JSON.stringify(stats));
};

// Update stats with new move time
export const updateStatsWithMove = (stats: ModelStats, moveTime: number): ModelStats => {
  const newTotalMoves = stats.totalMoves + 1;
  const newTotalTime = stats.totalTime + moveTime;
  const newAverageTime = newTotalTime / newTotalMoves;
  
  const updatedStats = {
    ...stats,
    totalMoves: newTotalMoves,
    totalTime: newTotalTime,
    averageTime: newAverageTime
  };
  
  // Save to localStorage
  saveStats(stats.name, updatedStats);
  
  return updatedStats;
}; 