
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InfoModal: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-4 right-4">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Model Arena: Tic-Tac-Toe</DialogTitle>
          <DialogDescription>
            Pit two machine learning models against each other in a classic game of Tic-Tac-Toe
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <section className="space-y-2">
            <h3 className="text-lg font-medium">Rules of Tic-Tac-Toe</h3>
            <p>Tic-Tac-Toe is played on a 3×3 grid. Model 1 uses X and Model 2 uses O.</p>
            <p>Models take turns placing their marks in empty cells.</p>
            <p>The first model to get three marks in a row (horizontally, vertically, or diagonally) wins.</p>
            <p>If all cells are filled and no model has three in a row, the game is a draw.</p>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium">Providing ML Models</h3>
            <p>There are two ways to provide models:</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Option 1: JavaScript Function</h4>
              <p>Your model should be a function that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Takes a board state array as input</li>
                <li>Returns a new board state array with your move</li>
              </ul>
              
              <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm overflow-x-auto">
{`// Example Model Function
const myModel = (board) => {
  // Make a copy of the board (don't modify original)
  const newBoard = [...board];
  
  // board is an array of length 9:
  // null = empty, 1 = Model 1 (X), 2 = Model 2 (O)
  
  // Find the first empty cell and place your mark
  for (let i = 0; i < newBoard.length; i++) {
    if (newBoard[i] === null) {
      newBoard[i] = 1; // Use your player number (1 or 2)
      break;
    }
  }
  
  // Return the new board state
  return newBoard;
}`}
              </pre>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mt-3">
              <h4 className="font-medium mb-2">Option 2: TensorFlow.js Model (URL)</h4>
              <p>Provide a URL to a TensorFlow.js model that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Takes a 1×9 tensor as input (representing the board)</li>
                <li>Outputs a 1×9 tensor of probabilities</li>
                <li>The highest probability for an empty cell will be chosen</li>
              </ul>
            </div>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium">Model Validation</h3>
            <p>Before the game starts, both models will be validated to ensure they:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Return valid board states</li>
              <li>Only modify one empty cell at a time</li>
              <li>Respond within a reasonable timeframe (2 seconds)</li>
              <li>Don't crash or throw errors</li>
            </ul>
          </section>
          
          <section className="space-y-2">
            <h3 className="text-lg font-medium">Game Flow</h3>
            <p>1. Click "Start" to begin a new game.</p>
            <p>2. A coin flip will determine which model goes first.</p>
            <p>3. Models take turns making moves (10-second time limit per move).</p>
            <p>4. The game ends when one model wins or there's a draw.</p>
            <p>5. Click "Reset" to prepare for a new game.</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;
