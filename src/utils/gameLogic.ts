import * as tf from '@tensorflow/tfjs';

export type CellValue = null | 1 | 2; // null = empty, 1 = X (Model 1), 2 = O (Model 2)
export type BoardState = CellValue[];

export type GameResult = {
  winner: null | 1 | 2;  // null = draw, 1 = Model 1, 2 = Model 2
  winningCells?: number[]; // Indices of winning cells for highlighting
};

export type BoardModelFunction = (state: BoardState | null) => Promise<BoardState>;
export type RPSModelFunction = (state: RPSGameState | null) => Promise<RPSChoice>;
export type ModelFunction = BoardModelFunction | RPSModelFunction;

export type ModelValidationResult = { valid: boolean; error?: string };

export interface ModelStats {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  invalidMoves: number;
  timeouts: number;
  crashes: number;
  totalMoves: number;
  totalTime: number; // Total time in milliseconds
  averageTime: number; // Average time per move in milliseconds
  coinFlipsWon: number;
}

// Initialize an empty board (3x3 grid represented as a 1D array of length 9)
export const initializeBoard = (): BoardState => Array(9).fill(null);

// Check if a given board state has a winner
export const checkWinner = (board: BoardState): GameResult => {
  // Winning combinations (row, column, diagonal)
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const [a, b, c] of winningCombinations) {
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningCells: [a, b, c] };
    }
  }

  // Check for a draw (all cells filled)
  if (board.every(cell => cell !== null)) {
    return { winner: null }; // Draw
  }

  // Game is still in progress
  return { winner: null, winningCells: undefined };
};

// Validate a move by comparing the old and new board states
export const validateMove = (oldBoard: BoardState, newBoard: BoardState, playerNumber: 1 | 2): boolean => {
  console.log(`[DEBUG] Validating move for player ${playerNumber}`);
  console.log(`[DEBUG] Old board:`, JSON.stringify(oldBoard));
  console.log(`[DEBUG] New board:`, JSON.stringify(newBoard));
  
  // 1. Ensure the new board is an array
  if (!Array.isArray(newBoard)) {
    console.log(`[DEBUG] Validation failed: newBoard is not an array`);
    return false;
  }

  // 2. Check if the array has the right length
  if (newBoard.length !== 9) {
    console.log(`[DEBUG] Validation failed: newBoard length is ${newBoard.length}, expected 9`);
    return false;
  }

  // 3. Make sure only one cell was changed
  let changedCellCount = 0;
  let changedCellIndex: number | null = null;

  for (let i = 0; i < 9; i++) {
    if (oldBoard[i] !== newBoard[i]) {
      changedCellCount++;
      changedCellIndex = i;
    }
  }

  console.log(`[DEBUG] Found ${changedCellCount} changed cells, index: ${changedCellIndex}`);

  if (changedCellCount !== 1) {
    console.log(`[DEBUG] Validation failed: ${changedCellCount} cells changed, expected 1`);
    return false;
  }
  if (changedCellIndex === null) {
    console.log(`[DEBUG] Validation failed: no changed cell index found`);
    return false;
  }

  // 4. The changed cell should have been empty and now contain the player's mark
  const isValid = oldBoard[changedCellIndex] === null && newBoard[changedCellIndex] === playerNumber;
  console.log(`[DEBUG] Move validation result: ${isValid}`);
  return isValid;
};

export const isRPSModel = (model: ModelFunction): model is RPSModelFunction => {
  return model.name.includes('RPS') || model.toString().includes('RPSChoice');
};

export const isBoardModel = (model: ModelFunction): model is BoardModelFunction => {
  return !isRPSModel(model);
};

// Validate a model function before the game starts
export async function validateModel(model: RPSModelFunction | BoardModelFunction): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log('[DEBUG] Starting model validation');
    
    // Type check
    if (typeof model !== 'function') {
      return { 
        valid: false, 
        error: `Model must be a function, got ${typeof model}` 
      };
    }

    // Test cases for RPS model
    if (isRPSModel(model)) {
      console.log('[DEBUG] Validating RPS model');
      
      // Test null state
      const nullResult = await model(null);
      if (!validateRPSChoice(nullResult)) {
        return { 
          valid: false, 
          error: `Invalid response for null state: ${nullResult}` 
        };
      }

      // Test empty game state
      const emptyState = initializeRPSGame();
      const emptyResult = await model(emptyState);
      if (!validateRPSChoice(emptyResult)) {
        return { 
          valid: false, 
          error: `Invalid response for empty state: ${emptyResult}` 
        };
      }

      // Test game state with moves
      const gameState = {
        ...emptyState,
        player1Choice: 'rock' as RPSChoice,
        round: 2
      };
      const gameResult = await model(gameState);
      if (!validateRPSChoice(gameResult)) {
        return { 
          valid: false, 
          error: `Invalid response for game state: ${gameResult}` 
        };
      }

      // Test response time
      const startTime = performance.now();
      await model(null);
      const duration = performance.now() - startTime;
      if (duration > 5000) {
        return { 
          valid: false, 
          error: `Model response too slow: ${duration}ms` 
        };
      }

      console.log('[DEBUG] RPS model validation successful');
      return { valid: true };
    }
    
    // Test cases for Board model
    if (isBoardModel(model)) {
      console.log('[DEBUG] Validating Board model');
      
      // Test null state
      const nullResult = await model(null);
      if (!Array.isArray(nullResult) || nullResult.length !== 9) {
        return { 
          valid: false, 
          error: 'Invalid board response for null state' 
        };
      }

      // Test empty board
      const emptyBoard = initializeBoard();
      const emptyResult = await model(emptyBoard);
      if (!Array.isArray(emptyResult) || emptyResult.length !== 9) {
        return { 
          valid: false, 
          error: 'Invalid board response for empty board' 
        };
      }

      // Test response time
      const startTime = performance.now();
      await model(emptyBoard);
      const duration = performance.now() - startTime;
      if (duration > 5000) {
        return { 
          valid: false, 
          error: `Model response too slow: ${duration}ms` 
        };
      }

      console.log('[DEBUG] Board model validation successful');
      return { valid: true };
    }

    return { 
      valid: false, 
      error: 'Unknown model type' 
    };
    
  } catch (error) {
    console.error('[ERROR] Model validation failed:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return { 
      valid: false, 
      error: `Validation error: ${error.message}` 
    };
  }
}

// Initialize model statistics
export const initializeStats = (name: string): ModelStats => ({
  name,
  wins: 0,
  losses: 0,
  draws: 0,
  invalidMoves: 0,
  timeouts: 0,
  crashes: 0,
  totalMoves: 0,
  totalTime: 0,
  averageTime: 0,
  coinFlipsWon: 0
});

// Create a simple synchronous test model
export const createTestModel = (playerNumber: 1 | 2): ModelFunction => {
  return async (board: BoardState): Promise<BoardState> => {
    console.log(`Test model ${playerNumber} called`);
    const newBoard = [...board];
    
    // Find first empty cell
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        newBoard[i] = playerNumber;
        console.log(`Test model ${playerNumber} placing move at ${i}`);
        return newBoard;
      }
    }
    
    return newBoard;
  };
};

// Create a simple deterministic model for demo purposes
export const createDemoModel = (name: string, preference: 'center' | 'corners' | 'random', playerNumber: 1 | 2): ModelFunction => {
  console.log(`[DEBUG] Creating demo model for ${name} (Player ${playerNumber}) with preference: ${preference}`);
  
  // Create a closure to store the model function
  const modelFunction = async (board: BoardState): Promise<BoardState> => {
    console.log(`[DEBUG] Demo model ${playerNumber} called with board:`, JSON.stringify(board));
    console.log(`[DEBUG] Model ${playerNumber} starting move calculation...`);
    console.log(`[DEBUG] Model ${playerNumber} board type:`, typeof board);
    console.log(`[DEBUG] Model ${playerNumber} board is array:`, Array.isArray(board));
    console.log(`[DEBUG] Model ${playerNumber} board length:`, board?.length);
    
    try {
      // Handle null or invalid board
      if (!board || !Array.isArray(board) || board.length !== 9) {
        console.log(`[DEBUG] Model ${playerNumber}: Invalid board, initializing new board`);
        console.log(`[DEBUG] Model ${playerNumber}: Board validation failed -`, {
          isNull: !board,
          isArray: Array.isArray(board),
          length: board?.length
        });
        return initializeBoard();
      }
      
      // Make sure we create a new board instead of modifying the original
      const newBoard = [...board];
      console.log(`[DEBUG] Model ${playerNumber}: Created new board copy:`, JSON.stringify(newBoard));
      
      // Find empty cells
      const availableCells = [];
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          availableCells.push(i);
        }
      }
      
      console.log(`[DEBUG] Model ${playerNumber} found ${availableCells.length} available cells:`, availableCells);
      
      if (availableCells.length === 0) {
        console.log(`[DEBUG] Model ${playerNumber}: No available cells, returning original board`);
        return newBoard;
      }
      
      let chosenCell: number;
      
      if (preference === 'center' && board[4] === null) {
        // Prefer center if available
        chosenCell = 4;
        console.log(`[DEBUG] Model ${playerNumber}: Choosing center cell (4)`);
      } else if (preference === 'corners') {
        // Prefer corners if available
        const corners = [0, 2, 6, 8].filter(idx => board[idx] === null);
        if (corners.length > 0) {
          chosenCell = corners[Math.floor(Math.random() * corners.length)];
          console.log(`[DEBUG] Model ${playerNumber}: Choosing corner cell ${chosenCell}`);
        } else {
          // If no corners available, take any available space
          chosenCell = availableCells[Math.floor(Math.random() * availableCells.length)];
          console.log(`[DEBUG] Model ${playerNumber}: No corners available, choosing random cell ${chosenCell}`);
        }
      } else {
        // Random choice
        chosenCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        console.log(`[DEBUG] Model ${playerNumber}: Choosing random cell ${chosenCell}`);
      }
      
      console.log(`[DEBUG] Model ${playerNumber}: Simulating thinking time...`);
      // Simulate thinking time (100-500ms)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
      
      // Place the move using the correct player number (1 or 2)
      newBoard[chosenCell] = playerNumber;
      console.log(`[DEBUG] Model ${playerNumber} returning board:`, JSON.stringify(newBoard));
      return newBoard;
    } catch (error) {
      console.error(`[ERROR] Demo model ${playerNumber} error:`, error);
      console.error(`[ERROR] Demo model ${playerNumber} error stack:`, error.stack);
      throw error; // Re-throw to be handled by the game logic
    }
  };
  
  // Verify the function was created properly
  if (typeof modelFunction !== 'function') {
    console.error(`[ERROR] Failed to create demo model for ${name} (Player ${playerNumber})`);
    throw new Error(`Failed to create demo model for ${name} (Player ${playerNumber})`);
  }
  
  console.log(`[DEBUG] Successfully created demo model for ${name} (Player ${playerNumber})`);
  return modelFunction;
};

// Rock Paper Scissors Types
export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'win' | 'lose' | 'draw';
export type RPSDemoStrategy = 'random' | 'pattern' | 'counter' | 'adaptive';

export interface RPSGameState {
  player1Choice: RPSChoice | null;
  player2Choice: RPSChoice | null;
  result: RPSResult | null;
  player1Score: number;
  player2Score: number;
  round: number;
}

// Rock Paper Scissors Functions
export const initializeRPSGame = (): RPSGameState => ({
  player1Choice: null,
  player2Choice: null,
  result: null,
  player1Score: 0,
  player2Score: 0,
  round: 1
});

// Add stronger type guard for RPSChoice
export const isRPSChoice = (value: any): value is RPSChoice => {
  return typeof value === 'string' && ['rock', 'paper', 'scissors'].includes(value);
};

export const validateRPSChoice = (choice: any): choice is RPSChoice => {
  return isRPSChoice(choice);
};

export const determineRPSWinner = (choice1: RPSChoice, choice2: RPSChoice): RPSResult => {
  if (choice1 === choice2) return 'draw';
  
  const winningCombinations: Record<RPSChoice, RPSChoice> = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
  };

  return winningCombinations[choice1] === choice2 ? 'win' : 'lose';
};

// Helper function to get the counter move
const getCounterMove = (lastOpponentMove: RPSChoice): RPSChoice => {
  const counterMoves: Record<RPSChoice, RPSChoice> = {
    rock: 'paper',
    paper: 'scissors',
    scissors: 'rock'
  };
  return counterMoves[lastOpponentMove];
};

// Helper function to get a random move
const getRandomMove = (): RPSChoice => {
  const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];
  return choices[Math.floor(Math.random() * choices.length)];
};

export const createRPSDemoModel = (
  name: string,
  strategy: RPSDemoStrategy,
  playerNumber: 1 | 2
): RPSModelFunction => {
  console.log(`[DEBUG] Creating demo model for ${name} (Player ${playerNumber}) with strategy: ${strategy}`);
  
  let lastOpponentMove: RPSChoice | null = null;
  let moveHistory: RPSChoice[] = [];
  
  const modelFn = async (gameState: RPSGameState | null): Promise<RPSChoice> => {
    console.log(`[DEBUG] Demo model called with state:`, gameState);
    
    try {
      // Add artificial delay to simulate thinking (100-500ms)
      const delay = Math.floor(Math.random() * 400) + 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Update move history if we have a valid game state
      if (gameState) {
        const opponentMove = playerNumber === 1 ? gameState.player2Choice : gameState.player1Choice;
        if (opponentMove) {
          lastOpponentMove = opponentMove;
          moveHistory.push(opponentMove);
        }
      }
      
      let move: RPSChoice;
      
      switch (strategy) {
        case 'random':
          move = getRandomMove();
          break;
          
        case 'pattern':
          // Cycle through moves in a fixed pattern
          const patternMoves: RPSChoice[] = ['rock', 'paper', 'scissors'];
          const nextIndex = moveHistory.length % patternMoves.length;
          move = patternMoves[nextIndex];
          break;
          
        case 'counter':
          // Counter the opponent's last move if available, otherwise random
          move = lastOpponentMove ? getCounterMove(lastOpponentMove) : getRandomMove();
          break;
          
        case 'adaptive':
          // Use a mix of counter and random strategies
          if (lastOpponentMove && Math.random() > 0.3) {
            move = getCounterMove(lastOpponentMove);
          } else {
            move = getRandomMove();
          }
          break;
          
        default:
          console.warn(`[DEBUG] Unknown strategy ${strategy}, falling back to random`);
          move = getRandomMove();
      }
      
      console.log(`[DEBUG] Demo model selected move:`, move);
      return move;
      
    } catch (error) {
      console.error(`[DEBUG] Error in demo model:`, error);
      // In case of error, return a random move as fallback
      return getRandomMove();
    }
  };
  
  // Add metadata to the function for type checking
  Object.defineProperty(modelFn, 'name', { value: `RPS_${name}_${strategy}` });
  
  // Test the model immediately to ensure it works
  modelFn(null).catch(error => {
    console.error(`[DEBUG] Initial model test failed:`, error);
  });
  
  return modelFn;
};
