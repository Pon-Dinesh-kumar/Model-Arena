import React, { useState, useEffect, useRef } from "react";
import * as tf from '@tensorflow/tfjs';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { playSound } from "@/utils/sounds";
import { updateStatsWithMove } from "@/utils/statsManager";
import { useRouteMusic } from '../../../presentation/hooks/useRouteMusic';

import TicTacToeBoard from "@/components/TicTacToeBoard";
import ModelStats from "@/components/ModelStats";
import InfoModal from "@/components/InfoModal";
import ModelFileUpload from "@/components/ModelFileUpload";

import { 
  BoardState, 
  CellValue, 
  ModelFunction, 
  initializeBoard, 
  checkWinner, 
  validateMove, 
  validateModel,
  ModelStats as ModelStatsType,
  initializeStats,
  createDemoModel,
  GameResult
} from "@/utils/gameLogic";

import { 
  parseModelFunction, 
  randomModel, 
  loadModelFromFile 
} from "@/utils/modelIntegration";

interface GameState {
  board: BoardState;
  isPlayerTurn: boolean;
  gameState: string | null;
  inProgress: boolean;
  over: boolean;
}

const Playground = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  useRouteMusic();
  
  // Game state
  const [board, setBoard] = useState<BoardState>(initializeBoard());
  const [gameInProgress, setGameInProgress] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winResult, setWinResult] = useState<{ winner: CellValue; winningCells?: number[] }>({
    winner: null
  });
  
  // Model state
  const [models, setModels] = useState<{
    model2: ModelFunction | null;
  }>({
    model2: null
  });
  const [model2ValidationError, setModel2ValidationError] = useState<string | null>(null);
  const [modelThinking, setModelThinking] = useState<1 | 2 | null>(null);
  
  // Model refs for immediate access
  const model2Ref = useRef<ModelFunction | null>(null);
  
  // UI state
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [flippedResult, setFlippedResult] = useState<1 | 2 | null>(null);
  const [statusMessage, setStatusMessage] = useState("Welcome to The Super One");
  
  // Input fields state
  const [model2Name, setModel2Name] = useState("");
  const [model2ApiKey, setModel2ApiKey] = useState("");
  const [model2Input, setModel2Input] = useState("");
  const [model1Type, setModel1Type] = useState<"function" | "url" | "demo" | "file">("demo");
  const [model2Type, setModel2Type] = useState<"function" | "url" | "demo" | "file">("demo");
  const [model1Demo, setModel1Demo] = useState<"center" | "corners" | "random">("center");
  const [model2Demo, setModel2Demo] = useState<"center" | "corners" | "random">("corners");
  
  // Game statistics
  const [model1Stats, setModel1Stats] = useState<ModelStatsType>(() => initializeStats("You"));
  const [model2Stats, setModel2Stats] = useState<ModelStatsType>(() => initializeStats(model2Name));
  
  // Refs
  const moveTimeoutRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState>({
    board: initializeBoard(),
    isPlayerTurn: true,
    gameState: null,
    inProgress: false,
    over: false
  });
  const boardRef = useRef<BoardState>(initializeBoard());
  
  // Additional game state
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<string | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  
  // Add new state for match count
  const [matchCount, setMatchCount] = useState<1 | 5 | 10 | 20>(1);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  
  // Place this after all useState/useRef/useEffect hooks, before any function definitions
  useEffect(() => {
    if (gameInProgress && !gameOver && currentPlayer === 2) {
      makeModelMove();
    }
  }, [currentPlayer, gameInProgress, gameOver]);
  
  // Effect to update stats when names change
  useEffect(() => {
    setModel1Stats(prev => ({ ...prev, name: "You" }));
    setModel2Stats(prev => ({ ...prev, name: model2Name }));
  }, [model2Name]);
  
  // Effect to sync game state with ref
  useEffect(() => {
    gameStateRef.current = {
      board,
      isPlayerTurn,
      gameState,
      inProgress: gameInProgress,
      over: gameOver
    };
  }, [board, isPlayerTurn, gameState, gameInProgress, gameOver]);
  
  // Effect to sync model refs with state
  useEffect(() => {
    if (models.model2) {
      model2Ref.current = models.model2;
    }
  }, [models.model2]);
  
  // Effect to sync board with ref
  useEffect(() => {
    boardRef.current = board;
  }, [board]);
  
  // Initialize TensorFlow
  useEffect(() => {
    tf.ready().then(() => {
      console.log("TensorFlow.js is ready");
    }).catch(error => {
      console.error("TensorFlow.js initialization error:", error);
      toast({
        title: "TensorFlow.js Error",
        description: "Failed to initialize TensorFlow.js. Some features may not work properly.",
        variant: "destructive"
      });
    });
  }, [toast]);
  
  // Handle coin flip animation and result
  const performCoinFlip = () => {
    console.log('[DEBUG] Starting coin flip...');
    playSound('coinFlip');
    
    setShowCoinFlip(true);
    setFlippedResult(null);
    
    // After animation, set the result
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 1 : 2;
      console.log(`[DEBUG] Coin flip result: Player ${result}`);
      
      setFlippedResult(result);
      setCurrentPlayer(result);
      setStatusMessage(`You goes first`);
      
      // Hide coin after showing result
      setTimeout(() => {
        setShowCoinFlip(false);
        // Start game after coin flip animation
        setTimeout(() => {
          console.log('[DEBUG] Starting first move...');
          
          // Verify models are still valid
          const currentModel = result === 1 ? models.model2 : models.model2;
          if (typeof currentModel !== 'function') {
            console.error('[ERROR] Model not valid before first move:');
            setGameInProgress(false);
            setStatusMessage(`Error: You is not properly initialized`);
            playSound('error');
            return;
          }
          
          // Ensure we have a valid board state
          const currentBoard = [...board];
          console.log(`[DEBUG] Starting first move with board:`, JSON.stringify(currentBoard));
          
          makeModelMove();
        }, 500);
      }, 1500);
    }, 1500);
  };
  
  // Initialize or update models based on input
  const initializeModels = async () => {
    console.log('[DEBUG] Starting model initialization...');
    console.log('[DEBUG] Current game state:', {
      board: board,
      isPlayerTurn: isPlayerTurn,
      gameState: gameState
    });
    
    let model2Function: ModelFunction | null = null;
    
    setModel2ValidationError(null);
    
    // Initialize Model 2
    try {
      console.log(`[DEBUG] Initializing Model 2 (${model2Name}) with type: ${model2Type}`);
      if (model2Type === "demo") {
        try {
          model2Function = createDemoModel(model2Name, model2Demo, 2);
          console.log('[DEBUG] Model 2 function created:', typeof model2Function);
          
          // Verify the function was created properly
          if (typeof model2Function !== 'function') {
            throw new Error('Model 2 function was not created properly');
          }
          
          // Validate the model
          console.log('[DEBUG] Validating Model 2...');
          const validationResult = await validateModel(model2Function);
          if (!validationResult.valid) {
            console.error('[ERROR] Model 2 validation failed:', validationResult.error);
            setModel2ValidationError(validationResult.error || 'Validation failed');
            return false;
          }
          console.log('[DEBUG] Model 2 validation successful');
        } catch (error) {
          console.error('[ERROR] Failed to create Model 2:', error);
          setModel2ValidationError(`Error creating model: ${error}`);
          return false;
        }
      } else if (model2Type === "function" && model2Input.trim()) {
        model2Function = parseModelFunction(model2Input);
      } else if (model2Type === "url" && model2Input.trim()) {
        model2Function = randomModel;
      } else if (model2Type === "file") {
        model2Function = null;
        setModel2Input('');
      }
    } catch (error) {
      console.error("[ERROR] Error initializing Model 2:", error);
      console.error("[ERROR] Model 2 error stack:", error.stack);
      setModel2ValidationError(`Error: ${error}`);
      return false;
    }
    
    // Set models if both are valid
    if (model2Function) {
      console.log('[DEBUG] Both models initialized successfully');
      console.log('[DEBUG] Setting models in state...');
      
      // Set models in state
      setModels({
        model2: model2Function
      });
      
      // Wait for state update to complete
      await new Promise<void>((resolve) => {
        const checkState = () => {
          if (models.model2) {
            console.log('[DEBUG] Model state updated successfully');
            resolve();
          } else {
            console.log('[DEBUG] Waiting for model state update...');
            setTimeout(checkState, 50);
          }
        };
        checkState();
      });
      
      console.log('[DEBUG] Model initialization complete');
      return true;
    }
    
    console.log('[DEBUG] Model initialization failed');
    return false;
  };
  
  // Make a move for the current model
  const makeModelMove = async () => {
    if (!gameInProgress || gameOver || currentPlayer !== 2) return;
    setModelThinking(2);
    setStatusMessage(`${model2Name || 'Model O'} is thinking...`);
    const model = models.model2;
    if (typeof model !== 'function') {
      setStatusMessage('Model O is not properly initialized');
      setGameInProgress(false);
      setGameOver(true);
      setModelThinking(null);
      return;
    }
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newBoard = await model([...board]);
    setModelThinking(null);
    setBoard(newBoard);
    setModel2Stats(prev => ({ ...prev, totalMoves: prev.totalMoves + 1 }));
    playSound('move');
    const result = checkWinner(newBoard);
    if (result.winner !== null || result.winningCells) {
      setWinResult(result);
      setGameOver(true);
      setGameInProgress(false);
      if (result.winner === 2) {
        setModel2Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
        setModel1Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
        setStatusMessage(`${model2Name || 'Model O'} wins!`);
      } else if (result.winner === 1) {
        setModel1Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
        setModel2Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
        setStatusMessage('You win!');
      } else {
        setModel1Stats(prev => ({ ...prev, draws: prev.draws + 1 }));
        setModel2Stats(prev => ({ ...prev, draws: prev.draws + 1 }));
        setStatusMessage("It's a draw!");
      }
      return;
    }
    // Not over, human's turn
    setCurrentPlayer(1);
    setStatusMessage('Your turn!');
  };
  
  // Start new game
  const startGame = async () => {
    playSound('click');
    console.log('[DEBUG] Starting new game...');
    
    // Reset game state
    const initialBoard = initializeBoard();
    console.log('[DEBUG] Initialized board:', JSON.stringify(initialBoard));
    
    // Initialize models first
    const modelsReady = await initializeModels();
    
    if (!modelsReady) {
      console.log('[DEBUG] Model initialization failed');
      setStatusMessage("Failed to initialize models. Check for errors.");
      return;
    }
    
    // Verify models are set
    if (!models.model2) {
      console.error('[ERROR] Models not properly initialized');
      console.error('[ERROR] Model state:', {
        model2: !!models.model2
      });
      setStatusMessage("Error: Models not properly initialized");
      return;
    }
    
    // Set all game state at once to prevent race conditions
    console.log('[DEBUG] Setting initial game state...');
    setBoard(initialBoard);
    setGameOver(false);
    setWinResult({ winner: null });
    setGameInProgress(true);
    setCurrentPlayer(1); // Reset current player
    setCurrentMatch(0);
    setIsReplaying(true);
    setStatusMessage(`Starting match 1 of ${matchCount}...`);
    
    // Force a state update to ensure game state is set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('[DEBUG] Game state after initialization:', {
      inProgress: gameStateRef.current.inProgress,
      over: gameStateRef.current.over,
      board: board,
      model2: !!models.model2
    });
    
    // Verify game state is correct
    if (!gameStateRef.current.inProgress || gameStateRef.current.over) {
      console.error('[ERROR] Game state not properly set after initialization');
      console.error('[ERROR] Game state:', {
        inProgress: gameStateRef.current.inProgress,
        over: gameStateRef.current.over
      });
      setStatusMessage("Error: Game state not properly initialized");
      return;
    }
    
    // Start with coin flip animation
    setStatusMessage("Flipping coin to determine who goes first...");
    performCoinFlip();
  };
  
  // Reset game
  const resetGame = () => {
    playSound('click');
    // Clear any pending move timeouts
    if (moveTimeoutRef.current !== null) {
      window.clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = null;
    }
    
    // Reset game state but preserve stats
    setBoard(initializeBoard());
    setGameInProgress(false);
    setGameOver(false);
    setCurrentPlayer(1);
    setWinResult({ winner: null });
    setModelThinking(null);
    setStatusMessage("Ready for a new game");
  };

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      setGameInProgress(true);
      setGameOver(false);
      setGameState('Game Started');
      setIsLoading(false);
    } catch (error) {
      console.error('Error starting game:', error);
      setIsLoading(false);
    }
  };

  const handleCellClick = async (index: number) => {
    if (!gameInProgress || gameOver || currentPlayer !== 1 || board[index] !== null) return;
    // Human plays X (1)
    const newBoard = [...board];
    newBoard[index] = 1;
    setBoard(newBoard);
    setModel1Stats(prev => ({ ...prev, totalMoves: prev.totalMoves + 1 }));
    playSound('move');
    const result = checkWinner(newBoard);
    if (result.winner !== null || result.winningCells) {
      setWinResult(result);
      setGameOver(true);
      setGameInProgress(false);
      if (result.winner === 1) {
        setModel1Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
        setModel2Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
        setStatusMessage('You win!');
      } else if (result.winner === 2) {
        setModel2Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
        setModel1Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
        setStatusMessage(`${model2Name || 'Model O'} wins!`);
      } else {
        setModel1Stats(prev => ({ ...prev, draws: prev.draws + 1 }));
        setModel2Stats(prev => ({ ...prev, draws: prev.draws + 1 }));
        setStatusMessage("It's a draw!");
      }
      return;
    }
    // Not over, model's turn
    setCurrentPlayer(2);
  };

  const handleResetGame = () => {
    setBoard(initializeBoard());
    setGameState(null);
    setIsPlayerTurn(true);
    setGameInProgress(false);
    setGameOver(false);
  };

  const getCellDisplay = (value: CellValue): string => {
    if (value === 1) return 'X';
    if (value === 2) return 'O';
    return '';
  };

  const getCellColor = (value: CellValue): string => {
    if (value === 1) return 'text-cyber-accent';
    if (value === 2) return 'text-cyber-accent-2';
    return 'text-cyber-light';
  };

  // Clear all data
  const clearAllData = () => {
    // Clear model names
    setModel2Name("");
    
    // Clear model inputs
    setModel2Input("");
    
    // Reset model types to demo
    setModel2Type("demo");
    
    // Reset demo preferences
    setModel2Demo("corners");
    
    // Clear validation errors
    setModel2ValidationError(null);
    
    // Reset models
    setModels({
      model2: null
    });
    
    // Reset stats
    setModel1Stats(initializeStats("You"));
    setModel2Stats(initializeStats(model2Name));
    
    // Clear localStorage
    localStorage.removeItem(`model_stats_${model2Name}`);
    
    // Reset game state
    setBoard(initializeBoard());
    setGameInProgress(false);
    setGameOver(false);
    setCurrentPlayer(1);
    setWinResult({ winner: null });
    setModelThinking(null);
    setStatusMessage("Welcome to The Super One");
    
    // Show confirmation toast
    toast({
      title: "Data Cleared",
      description: "All model data and configurations have been reset.",
    });
  };

  // Modify handleMatchComplete to use useEffect for better state management
  useEffect(() => {
    const handleMatchComplete = async () => {
      if (currentMatch < matchCount - 1) {
        // Wait for 2-3 seconds to show victory animation
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        
        // Start next match
        setCurrentMatch(prev => prev + 1);
        setBoard(initializeBoard());
        setGameOver(false);
        setWinResult({ winner: null });
        setGameInProgress(true);
        setCurrentPlayer(1);
        setStatusMessage(`Starting match ${currentMatch + 2} of ${matchCount}...`);
        performCoinFlip();
      } else {
        // All matches completed
        setIsReplaying(false);
        setStatusMessage("All matches completed!");
      }
    };

    if (gameOver && isReplaying) {
      handleMatchComplete();
    }
  }, [gameOver, isReplaying, currentMatch, matchCount]);

  return (
    <div className="min-h-screen bg-cyber-dark bg-cyber-gradient relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-[length:50px_50px] opacity-20"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-cyber-glow rounded-full blur-3xl opacity-20 animate-cyber-float"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyber-accent-2 rounded-full blur-3xl opacity-20 animate-cyber-float" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center glass-effect-strong fixed top-0 left-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate('/games/tictactoe')} 
            className="glass-button font-pixel px-4 py-2 hover:scale-105 transition-all duration-300"
          >
            ← Back
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Model Arena Logo" className="h-12 w-12" />
            <div className="text-2xl font-bold bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text font-pixel">
              Tic Tac Toe HvM
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate('/')}
            className="glass-button font-pixel px-4 py-2 hover:scale-105 transition-all duration-300"
          >
            Home
          </Button>
          <Button 
            onClick={() => navigate('/games')}
            className="glass-button font-pixel px-4 py-2 hover:scale-105 transition-all duration-300"
          >
            Games
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Human Stats Only */}
          <div className="w-full lg:w-1/4">
            <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent/30 shadow-cyber hover:shadow-cyber-glow transition-all duration-300 transform hover:scale-[1.02] flex flex-col gap-6 items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF3CBD] to-[#00F2A9] flex items-center justify-center text-4xl font-pixel text-white shadow-lg border-4 border-cyber-accent">😎</div>
                <h2 className="text-xl font-bold text-cyber-accent font-pixel">You (X)</h2>
              </div>
              <div className="w-full mt-2">
                <h3 className="text-lg font-bold text-cyber-light mb-3 font-pixel">Your Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Wins</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.wins}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Losses</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.losses}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Draws</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.draws}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Win Rate</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.wins + model1Stats.losses + model1Stats.draws > 0 ? `${Math.round((model1Stats.wins / (model1Stats.wins + model1Stats.losses + model1Stats.draws)) * 100)}%` : '0%'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Board - Center */}
          <div className="w-full lg:w-2/4">
            <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-l-cyber-accent border-r-cyber-accent-2 shadow-cyber hover:shadow-cyber-glow transition-all duration-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-cyber-light mb-3 font-pixel">Game Status</h2>
                <div className="bg-cyber-secondary/30 rounded-xl p-4 border-2 border-l-cyber-accent/20 border-r-cyber-accent-2/20">
                  {showCoinFlip ? (
                    <p className="text-cyber-accent text-lg animate-cyber-pulse font-pixel">
                      Flipping coin to determine who goes first...
                    </p>
                  ) : gameOver ? (
                    <div className="space-y-2">
                      <p className="text-cyber-accent text-lg font-medium font-pixel">
                        {winResult.winner ? (
                          <span>
                            <span className="text-cyber-accent-2 font-bold">{winResult.winner === 1 ? "You" : (model2Name || "Model O")}</span> wins the match!
                          </span>
                        ) : (
                          "Game ended in a draw!"
                        )}
                      </p>
                      {isReplaying && (
                        <p className="text-cyber-light/80 text-sm font-pixel">
                          Match {currentMatch + 1} of {matchCount}
                        </p>
                      )}
                    </div>
                  ) : gameInProgress ? (
                    <div className="space-y-2">
                      <p className="text-cyber-accent text-lg font-medium font-pixel">
                        {modelThinking ? (
                          <span>
                            <span className="text-cyber-accent-2 font-bold">{modelThinking === 1 ? "You" : (model2Name || "Model O")}</span> is thinking...
                          </span>
                        ) : (
                          <span>
                            <span className="text-cyber-accent-2 font-bold">{currentPlayer === 1 ? "You" : (model2Name || "Model O")}</span>'s turn
                          </span>
                        )}
                      </p>
                      {isReplaying && (
                        <p className="text-cyber-light/80 text-sm font-pixel">
                          Match {currentMatch + 1} of {matchCount}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-cyber-accent text-lg font-medium font-pixel">
                        Ready to start a new game
                      </p>
                      <p className="text-cyber-light/80 text-sm font-pixel">
                        <span className="text-cyber-accent-2 font-bold">You</span> vs <span className="text-cyber-accent-2 font-bold">{model2Name || "Model O"}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                {/* Coin Flip with improved animation */}
                {showCoinFlip && (
                  <div className="absolute inset-0 flex items-center justify-center bg-cyber-primary/90 backdrop-blur-sm z-10 rounded-2xl">
                    <div className={`coin ${flippedResult ? '' : 'coin-flipping'} text-4xl font-pixel`}>
                      {flippedResult ? (flippedResult === 1 ? 'X' : 'O') : '?'}
                    </div>
                  </div>
                )}

                {/* Victory Animation with improved effects */}
                {gameOver && winResult.winner && (
                  <div className="winning-animation">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h2 className={`victory-text ${winResult.winner === 1 ? 'text-cyber-accent' : 'text-cyber-accent-2'} font-pixel text-4xl animate-bounce`}>
                        {winResult.winner === 1 ? 'X' : 'O'} Wins!
                      </h2>
                    </div>
                  </div>
                )}

                {/* Game Board with improved styling */}
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  {board.map((cell, index) => (
                    <button
                      key={index}
                      onClick={() => handleCellClick(index)}
                      disabled={!gameInProgress || gameOver || currentPlayer !== 1 || cell !== null}
                      className={`
                        aspect-square bg-cyber-secondary/50 border-2 border-l-cyber-accent/30 border-r-cyber-accent-2/30 rounded-xl 
                        text-4xl font-bold font-pixel flex items-center justify-center 
                        transition-all duration-300 ${getCellColor(cell)}
                        ${!gameInProgress || gameOver || currentPlayer !== 1 || cell !== null
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-cyber-secondary hover:border-l-cyber-accent hover:border-r-cyber-accent-2 hover:shadow-cyber-glow transform hover:scale-105'
                        } 
                        ${winResult.winningCells?.includes(index)
                          ? cell === 1 ? 'winning-cell-x' : 'winning-cell-o'
                          : ''
                        }
                      `}
                    >
                      {getCellDisplay(cell)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Controls with improved styling */}
              <div className="mt-8 text-center">
                {gameOver ? (
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={startGame}
                      disabled={isLoading}
                      className="flex-1 px-6 py-4 rounded-xl text-cyber-light font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm font-pixel"
                    >
                      Rematch
                    </Button>
                    <Button
                      onClick={() => {
                        setGameInProgress(false);
                        setGameOver(false);
                        setBoard(initializeBoard());
                        setWinResult({ winner: null });
                      }}
                      className="flex-1 px-6 py-4 rounded-xl text-cyber-light font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm font-pixel"
                    >
                      Select Models
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-4 justify-center">
                    <div className="flex-1 flex gap-4">
                      {!gameInProgress && !gameOver && (
                        <div className="relative">
                          <label className="absolute -top-6 left-0 text-xs text-cyber-accent font-medium font-pixel">
                            Match Count
                          </label>
                          <select
                            value={matchCount}
                            onChange={(e) => setMatchCount(Number(e.target.value) as 1 | 5 | 10 | 20)}
                            className="w-32 bg-cyber-secondary/50 border-2 border-l-cyber-accent/30 border-r-cyber-accent-2/30 rounded-xl px-4 py-4 text-cyber-light text-base focus:outline-none focus:border-l-cyber-accent focus:border-r-cyber-accent-2 focus:shadow-cyber-glow transition-all duration-300 appearance-none cursor-pointer hover:border-l-cyber-accent hover:border-r-cyber-accent-2 hover:shadow-cyber-glow font-pixel"
                          >
                            <option value={1}>1 Match</option>
                            <option value={5}>5 Matches</option>
                            <option value={10}>10 Matches</option>
                            <option value={20}>20 Matches</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={gameInProgress ? resetGame : startGame}
                        disabled={isLoading}
                        className={`
                          flex-1 px-8 py-4 rounded-xl text-cyber-light font-bold text-lg 
                          transform hover:scale-105 transition-all duration-300 font-pixel
                          ${isLoading
                            ? 'bg-cyber-secondary/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm'
                          }
                        `}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-cyber-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Initializing...
                          </span>
                        ) : (
                          gameInProgress ? "Reset Game" : "Fight!"
                        )}
                      </Button>
                    </div>
                    {!gameInProgress && !gameOver && (
                      <Button
                        onClick={clearAllData}
                        className="flex-1 px-8 py-4 rounded-xl text-cyber-light font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm font-pixel"
                      >
                        Clear Data
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Model O Config */}
          <div className="w-full lg:w-1/4">
            {!gameInProgress && !gameOver ? (
              <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent-2/30 shadow-cyber-glow-pink hover:shadow-cyber-glow-pink hover:animate-cyber-glow-pink transition-all duration-300 transform hover:scale-[1.02]">
                <h2 className="text-xl font-bold text-cyber-light mb-4 flex items-center">
                  <span className="text-cyber-accent-2 mr-2 font-pixel">Model O</span>
                  <div className="w-2 h-2 bg-cyber-accent-2 rounded-full animate-cyber-pulse"></div>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-cyber-light text-sm mb-2 font-pixel">Model Name</label>
                    <input
                      type="text"
                      value={model2Name}
                      onChange={(e) => setModel2Name(e.target.value)}
                      className="w-full bg-cyber-secondary/50 border-2 border-cyber-accent-2/30 rounded-xl px-4 py-2 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent-2 focus:shadow-cyber-glow-pink transition-all duration-300 font-mono"
                      placeholder="Enter model name"
                    />
                  </div>
                  <div>
                    <label className="block text-cyber-light text-sm mb-2 font-pixel">Model Type</label>
                    <Tabs value={model2Type} onValueChange={(v) => setModel2Type(v as any)} className="w-full">
                      <TabsList className="w-full bg-cyber-secondary/50 rounded-xl p-1 grid grid-cols-4 gap-1">
                        <TabsTrigger value="demo" className="data-[state=active]:bg-cyber-accent-2 data-[state=active]:text-white rounded-lg font-pixel">Demo</TabsTrigger>
                        <TabsTrigger value="function" className="data-[state=active]:bg-cyber-accent-2 data-[state=active]:text-white rounded-lg font-pixel">Function</TabsTrigger>
                        <TabsTrigger value="url" className="data-[state=active]:bg-cyber-accent-2 data-[state=active]:text-white rounded-lg font-pixel">URL</TabsTrigger>
                        <TabsTrigger value="file" className="data-[state=active]:bg-cyber-accent-2 data-[state=active]:text-white rounded-lg font-pixel">File</TabsTrigger>
                      </TabsList>
                      <TabsContent value="demo" className="pt-2">
                        <select 
                          value={model2Demo} 
                          onChange={(e) => setModel2Demo(e.target.value as any)}
                          className="w-full bg-cyber-secondary/50 border-2 border-cyber-accent-2/30 rounded-xl px-4 py-2 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent-2 focus:shadow-cyber-glow-pink transition-all duration-300 font-pixel"
                        >
                          <option value="center">Prefer Center</option>
                          <option value="corners">Prefer Corners</option>
                          <option value="random">Random Moves</option>
                        </select>
                      </TabsContent>
                      <TabsContent value="function" className="pt-2">
                        <Textarea 
                          placeholder="Enter JavaScript function here..."
                          value={model2Input}
                          onChange={(e) => setModel2Input(e.target.value)}
                          className="min-h-[100px] font-mono text-xs bg-cyber-secondary/50 text-cyber-light border-2 border-cyber-accent-2/30 focus:border-cyber-accent-2 focus:shadow-cyber-glow-pink transition-all duration-300"
                        />
                      </TabsContent>
                      <TabsContent value="url" className="pt-2">
                        <Input
                          placeholder="Enter TensorFlow.js model URL"
                          value={model2Input}
                          onChange={(e) => setModel2Input(e.target.value)}
                          className="bg-cyber-secondary/50 text-cyber-light text-sm border-2 border-cyber-accent-2/30 focus:border-cyber-accent-2 focus:shadow-cyber-glow-pink transition-all duration-300 font-pixel"
                        />
                      </TabsContent>
                      <TabsContent value="file" className="pt-2">
                        <ModelFileUpload 
                          onFileSelect={async (file) => {
                            try {
                              const loadedModel = await loadModelFromFile(file);
                              setModels({
                                model2: loadedModel
                              });
                              setModel2Input('');
                              toast({
                                title: "Model loaded successfully",
                                description: "The model file has been loaded and is ready to use.",
                              });
                            } catch (error) {
                              console.error("Error loading model:", error);
                              setModel2ValidationError(`Failed to load model: ${error}`);
                            }
                          }}
                          disabled={gameInProgress}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  {model2ValidationError && (
                    <Alert variant="destructive" className="bg-cyber-warning/20 border-2 border-cyber-warning rounded-xl">
                      <AlertDescription className="font-pixel text-sm">{model2ValidationError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Model 2 Stats with updated styling */}
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-cyber-light mb-3 font-pixel">Model Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Wins</p>
                        <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.wins}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Losses</p>
                        <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.losses}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Draws</p>
                        <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.draws}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Win Rate</p>
                        <p className="text-cyber-accent-2 text-xl font-bold font-mono">
                          {model2Stats.wins + model2Stats.losses + model2Stats.draws > 0 
                            ? `${Math.round((model2Stats.wins / (model2Stats.wins + model2Stats.losses + model2Stats.draws)) * 100)}%`
                            : '0%'}
                        </p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Timeouts</p>
                        <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.timeouts}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Coin Flips Won</p>
                        <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.coinFlipsWon || 0}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Total Time</p>
                        <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.totalTime.toFixed(0)}ms</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Avg. Time</p>
                        <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.averageTime.toFixed(0)}ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent-2/30 shadow-cyber-glow-pink hover:shadow-cyber-glow-pink hover:animate-cyber-glow-pink transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-cyber-accent-2 font-pixel">{model2Name || "Model O"}</h3>
                  <div className={`w-2 h-2 rounded-full ${modelThinking === 2 ? 'bg-cyber-accent-2 animate-cyber-pulse' : 'bg-cyber-accent-2/30'}`}></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Wins</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.wins}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Losses</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.losses}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Draws</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.draws}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Win Rate</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">
                      {model2Stats.wins + model2Stats.losses + model2Stats.draws > 0 
                        ? `${Math.round((model2Stats.wins / (model2Stats.wins + model2Stats.losses + model2Stats.draws)) * 100)}%`
                        : '0%'}
                    </p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Invalid Moves</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.invalidMoves}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Timeouts</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.timeouts}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Crashes</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.crashes}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Total Moves</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.totalMoves}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Total Time</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.totalTime.toFixed(0)}ms</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Avg. Time</p>
                    <p className="text-cyber-accent-2 text-xl font-bold font-mono">{model2Stats.averageTime.toFixed(0)}ms</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
