import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { playSound } from "@/utils/sounds";
import RPSBoard from "@/components/RPSBoard";
import ModelStats from "@/components/ModelStats";
import ModelFileUpload from "@/components/ModelFileUpload";

import { 
  RPSChoice,
  RPSGameState,
  RPSResult,
  initializeRPSGame,
  determineRPSWinner,
  validateRPSChoice,
  ModelFunction,
  ModelStats as ModelStatsType,
  initializeStats,
  createRPSDemoModel
} from "@/utils/gameLogic";

const Human = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Game state
  const [gameState, setGameState] = useState<RPSGameState>(initializeRPSGame());
  const [gameInProgress, setGameInProgress] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  
  // Model state
  const [model, setModel] = useState<ModelFunction | null>(null);
  const [modelName, setModelName] = useState("AI Opponent");
  const [modelType, setModelType] = useState<"function" | "url" | "demo" | "file">("demo");
  const [modelDemo, setModelDemo] = useState<"random" | "pattern">("random");
  
  // Game statistics
  const [playerStats, setPlayerStats] = useState<ModelStatsType>(() => initializeStats("You"));
  const [modelStats, setModelStats] = useState<ModelStatsType>(() => initializeStats(modelName));

  // Initialize model
  useEffect(() => {
    if (modelType === "demo") {
      const demoModel = createRPSDemoModel(modelName, modelDemo, 2);
      setModel(demoModel);
    }
  }, [modelType, modelDemo, modelName]);

  // Handle player choice
  const handlePlayerChoice = async (choice: RPSChoice) => {
    if (!gameInProgress || gameOver || currentPlayer !== 1) return;

    playSound('click');
    
    // Update game state with player's choice
    setGameState(prev => ({
      ...prev,
      player1Choice: choice
    }));

    // Switch to AI's turn
    setCurrentPlayer(2);
  };

  // Handle model move
  const handleModelMove = async () => {
    if (!gameInProgress || gameOver || currentPlayer !== 2 || !model) return;

    try {
      // Simulate model thinking
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get model's choice
      const modelChoice = await model(null);
      if (validateRPSChoice(modelChoice)) {
        setGameState(prev => ({
          ...prev,
          player2Choice: modelChoice
        }));

        // Determine winner
        const result = determineRPSWinner(
          gameState.player1Choice!,
          modelChoice
        );
        
        // Update scores
        setGameState(prev => ({
          ...prev,
          result,
          player1Score: result === 'win' ? prev.player1Score + 1 : prev.player1Score,
          player2Score: result === 'lose' ? prev.player2Score + 1 : prev.player2Score,
          round: prev.round + 1
        }));

        // Update stats
        if (result === 'win') {
          setPlayerStats(prev => ({ ...prev, wins: prev.wins + 1 }));
          setModelStats(prev => ({ ...prev, losses: prev.losses + 1 }));
        } else if (result === 'lose') {
          setPlayerStats(prev => ({ ...prev, losses: prev.losses + 1 }));
          setModelStats(prev => ({ ...prev, wins: prev.wins + 1 }));
        } else {
          setPlayerStats(prev => ({ ...prev, draws: prev.draws + 1 }));
          setModelStats(prev => ({ ...prev, draws: prev.draws + 1 }));
        }

        // Reset choices for next round
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            player1Choice: null,
            player2Choice: null,
            result: null
          }));
          setCurrentPlayer(1);
        }, 2000);
      }
    } catch (error) {
      console.error('Model error:', error);
      toast({
        title: "Model Error",
        description: "The AI encountered an error. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Start new game
  const startGame = () => {
    playSound('click');
    setGameState(initializeRPSGame());
    setGameInProgress(true);
    setGameOver(false);
    setCurrentPlayer(1);
  };

  // Reset game
  const resetGame = () => {
    playSound('click');
    setGameState(initializeRPSGame());
    setGameInProgress(false);
    setGameOver(false);
    setCurrentPlayer(1);
  };

  // Effect to handle model moves
  useEffect(() => {
    if (gameInProgress && !gameOver && currentPlayer === 2) {
      handleModelMove();
    }
  }, [currentPlayer, gameInProgress, gameOver]);

  return (
    <div className="min-h-screen bg-cyber-dark bg-cyber-gradient relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-[length:50px_50px] opacity-20"></div>
      
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center glass-effect-strong fixed top-0 left-0 z-50">
        <div className="flex items-center gap-1">
          <img src="/logo.png" alt="Model Arena Logo" className="h-12 w-12" />
          <div className="text-2xl font-bold bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text">
            Rock Paper Scissors
          </div>
        </div>
        <nav className="flex gap-4">
          <Button onClick={() => navigate('/games')} className="glass-button">
            ← Back
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col items-center gap-8">
          {/* Model Configuration */}
          <div className="glass-effect p-4 rounded-lg w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">AI Configuration</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Model Type</label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value as any)}
                  className="w-full bg-cyber-dark border border-cyber-accent rounded px-3 py-2"
                >
                  <option value="demo">Demo Model</option>
                  <option value="file">Custom Model</option>
                </select>
              </div>
              {modelType === "demo" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Strategy</label>
                  <select
                    value={modelDemo}
                    onChange={(e) => setModelDemo(e.target.value as any)}
                    className="w-full bg-cyber-dark border border-cyber-accent rounded px-3 py-2"
                  >
                    <option value="random">Random</option>
                    <option value="pattern">Pattern</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Game Board */}
          <RPSBoard
            gameState={gameState}
            onChoice={handlePlayerChoice}
            disabled={!gameInProgress || gameOver || currentPlayer !== 1}
          />

          {/* Game Controls */}
          <div className="flex gap-4">
            {!gameInProgress ? (
              <Button onClick={startGame} className="glass-button">
                Start Game
              </Button>
            ) : (
              <Button onClick={resetGame} className="glass-button">
                Reset Game
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
            <ModelStats
              stats={playerStats}
              isActive={currentPlayer === 1}
              isThinking={false}
              playerNumber={1}
            />
            <ModelStats
              stats={modelStats}
              isActive={currentPlayer === 2}
              isThinking={currentPlayer === 2}
              playerNumber={2}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Human; 