
import React from 'react';
import { BoardState } from '@/utils/gameLogic';

interface TicTacToeBoardProps {
  board: BoardState;
  winningCells?: number[];
  disabled: boolean;
}

const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ board, winningCells = [], disabled }) => {
  // Render a cell based on its value and position
  const renderCell = (index: number) => {
    const cellValue = board[index];
    
    let cellClass = "tictactoe-cell";
    if (cellValue === 1) {
      cellClass += " tictactoe-cell-x";
    } else if (cellValue === 2) {
      cellClass += " tictactoe-cell-o";
    }
    
    if (winningCells.includes(index)) {
      cellClass += " winning-cell";
    }
    
    return (
      <div 
        key={index}
        className={cellClass}
        data-testid={`cell-${index}`}
      />
    );
  };

  return (
    <div 
      className={`grid grid-cols-3 gap-1 w-full max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden p-4 ${disabled ? 'opacity-90' : ''}`}
    >
      {Array(9).fill(null).map((_, index) => renderCell(index))}
    </div>
  );
};

export default TicTacToeBoard;
