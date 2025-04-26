import * as tf from '@tensorflow/tfjs';
import { ModelFunction, BoardState } from './gameLogic';

// Parse a JavaScript function string into a model function
export const parseModelFunction = (functionString: string): ModelFunction => {
  try {
    // Create a function from the string
    const modelFn = new Function('board', functionString) as ModelFunction;
    return modelFn;
  } catch (error) {
    console.error('Error parsing model function:', error);
    throw new Error('Invalid model function format');
  }
};

// Create a random model for testing
export const randomModel: ModelFunction = async (board: BoardState): Promise<BoardState> => {
  // Find all empty cells
  const emptyCells = board.reduce((acc: number[], cell, index) => {
    if (cell === null) acc.push(index);
    return acc;
  }, []);

  if (emptyCells.length === 0) {
    return board; // No moves available
  }

  // Choose a random empty cell
  const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newBoard = [...board];
  newBoard[randomIndex] = 2; // Model O is always player 2

  return newBoard;
};

// Load a model from a file
export const loadModelFromFile = async (file: File): Promise<ModelFunction> => {
  try {
    // Read the file content
    const text = await file.text();
    
    // Try to parse it as a JavaScript function
    try {
      return parseModelFunction(text);
    } catch (error) {
      console.error('Error parsing model as function:', error);
      throw new Error('Invalid model file format');
    }
  } catch (error) {
    console.error('Error loading model file:', error);
    throw new Error('Failed to load model file');
  }
}; 