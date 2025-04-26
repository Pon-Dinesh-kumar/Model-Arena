import React from 'react';
import { ModelStats as ModelStatsType } from '@/utils/gameLogic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CountdownTimer from './CountdownTimer';

interface ModelStatsProps {
  stats: ModelStatsType;
  isActive: boolean;
  isThinking: boolean;
  playerNumber: 1 | 2;
}

const ModelStats: React.FC<ModelStatsProps> = ({ stats, isActive, isThinking, playerNumber }) => {
  return (
    <Card className={`w-full transition-all ${isActive ? 'active-model' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium truncate flex items-center">
          <span className={`inline-block w-6 h-6 rounded-full text-white text-center mr-2 ${playerNumber === 1 ? 'bg-blue-600' : 'bg-red-600'}`}>
            {playerNumber}
          </span>
          {stats.name || `Model ${playerNumber}`}
          <CountdownTimer 
            duration={10} 
            isActive={isThinking} 
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-arena-secondary">Wins:</span>
          <span className="font-medium">{stats.wins}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-arena-secondary">Losses:</span>
          <span className="font-medium">{stats.losses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-arena-secondary">Draws:</span>
          <span className="font-medium">{stats.draws}</span>
        </div>
        <div className="border-t border-arena-border my-2" />
        <div className="flex justify-between">
          <span className="text-arena-secondary">Invalid Moves:</span>
          <span className="font-medium">{stats.invalidMoves}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-arena-secondary">Timeouts:</span>
          <span className="font-medium">{stats.timeouts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-arena-secondary">Crashes:</span>
          <span className="font-medium">{stats.crashes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-arena-secondary">Total Moves:</span>
          <span className="font-medium">{stats.totalMoves}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-arena-secondary">Total Time:</span>
          <span className="font-medium">{stats.totalTime.toFixed(0)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-arena-secondary">Avg. Time:</span>
          <span className="font-medium">{stats.averageTime.toFixed(0)}ms</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelStats;
