import React from 'react';
import { RPSChoice, RPSGameState } from '@/utils/gameLogic';

interface RPSBoardProps {
  gameState: RPSGameState;
  onChoice: (choice: RPSChoice) => void;
  disabled: boolean;
}

const RPSBoard: React.FC<RPSBoardProps> = ({ gameState, onChoice, disabled }) => {
  const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];

  const getChoiceEmoji = (choice: RPSChoice | null) => {
    switch (choice) {
      case 'rock': return '✊';
      case 'paper': return '✋';
      case 'scissors': return '✌️';
      default: return '❓';
    }
  };

  const getResultText = (result: 'win' | 'lose' | 'draw' | null) => {
    switch (result) {
      case 'win': return 'You Win!';
      case 'lose': return 'You Lose!';
      case 'draw': return 'Draw!';
      default: return '';
    }
  };

  return (
    <div className="glass-effect p-8 rounded-lg w-full max-w-2xl">
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Player 1 */}
        <div className="flex flex-col items-center">
          <div className="text-6xl mb-4">
            {getChoiceEmoji(gameState.player1Choice)}
          </div>
          <div className="text-lg font-bold">Player 1</div>
          <div className="text-sm text-cyber-light">Score: {gameState.player1Score}</div>
        </div>

        {/* Player 2 */}
        <div className="flex flex-col items-center">
          <div className="text-6xl mb-4">
            {getChoiceEmoji(gameState.player2Choice)}
          </div>
          <div className="text-lg font-bold">Player 2</div>
          <div className="text-sm text-cyber-light">Score: {gameState.player2Score}</div>
        </div>
      </div>

      {/* Result Display */}
      {gameState.result && (
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-cyber-accent">
            {getResultText(gameState.result)}
          </div>
          <div className="text-sm text-cyber-light">Round {gameState.round}</div>
        </div>
      )}

      {/* Choice Buttons */}
      <div className="grid grid-cols-3 gap-4">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => onChoice(choice)}
            disabled={disabled}
            className={`
              glass-button p-4 rounded-lg text-4xl
              transition-all duration-300
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
            `}
          >
            {getChoiceEmoji(choice)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RPSBoard; 