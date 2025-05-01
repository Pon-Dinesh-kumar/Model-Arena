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
    model1: ModelFunction | null;
    model2: ModelFunction | null;
  }>({
    model1: null,
    model2: null
  });
  const [model1ValidationError, setModel1ValidationError] = useState<string | null>(null);
  const [model2ValidationError, setModel2ValidationError] = useState<string | null>(null);
  const [modelThinking, setModelThinking] = useState<1 | 2 | null>(null);
  
  // Model refs for immediate access
  const model1Ref = useRef<ModelFunction | null>(null);
  const model2Ref = useRef<ModelFunction | null>(null);
  
  // UI state
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [flippedResult, setFlippedResult] = useState<1 | 2 | null>(null);
  const [statusMessage, setStatusMessage] = useState("Welcome to The Super One");
  
  // Input fields state
  const [model1Name, setModel1Name] = useState("");
  const [model2Name, setModel2Name] = useState("");
  const [model1ApiKey, setModel1ApiKey] = useState("");
  const [model2ApiKey, setModel2ApiKey] = useState("");
  const [model1Input, setModel1Input] = useState("");
  const [model2Input, setModel2Input] = useState("");
  const [model1Type, setModel1Type] = useState<"function" | "url" | "demo" | "file">("demo");
  const [model2Type, setModel2Type] = useState<"function" | "url" | "demo" | "file">("demo");
  const [model1Demo, setModel1Demo] = useState<"center" | "corners" | "random">("center");
  const [model2Demo, setModel2Demo] = useState<"center" | "corners" | "random">("corners");
  
  // Game statistics
  const [model1Stats, setModel1Stats] = useState<ModelStatsType>(() => initializeStats(model1Name));
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
  
  // Effect to update stats when names change
  useEffect(() => {
    setModel1Stats(prev => ({ ...prev, name: model1Name }));
    setModel2Stats(prev => ({ ...prev, name: model2Name }));
  }, [model1Name, model2Name]);
  
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
    if (models.model1) {
      model1Ref.current = models.model1;
    }
  }, [models.model1]);
  
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
      setStatusMessage(`${result === 1 ? model1Name : model2Name} goes first`);
      
      // Hide coin after showing result
      setTimeout(() => {
        setShowCoinFlip(false);
        // Start game after coin flip animation
        setTimeout(() => {
          console.log('[DEBUG] Starting first move...');
          
          // Verify models are still valid
          const currentModel = result === 1 ? models.model1 : models.model2;
          if (typeof currentModel !== 'function') {
            console.error('[ERROR] Model not valid before first move:');
            setGameInProgress(false);
            setStatusMessage(`Error: ${result === 1 ? model1Name : model2Name} is not properly initialized`);
            playSound('error');
            return;
          }
          
          // Ensure we have a valid board state
          const currentBoard = [...board];
          console.log(`[DEBUG] Starting first move with board:`, JSON.stringify(currentBoard));
          
          makeModelMove(result);
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
    
    let model1Function: ModelFunction | null = null;
    let model2Function: ModelFunction | null = null;
    
    setModel1ValidationError(null);
    setModel2ValidationError(null);
    
    // Initialize Model 1
    try {
      console.log(`[DEBUG] Initializing Model 1 (${model1Name}) with type: ${model1Type}`);
      if (model1Type === "demo") {
        try {
          model1Function = createDemoModel(model1Name, model1Demo, 1);
          console.log('[DEBUG] Model 1 function created:', typeof model1Function);
          
          // Verify the function was created properly
          if (typeof model1Function !== 'function') {
            throw new Error('Model 1 function was not created properly');
          }
          
          // Validate the model
          console.log('[DEBUG] Validating Model 1...');
          const validationResult = await validateModel(model1Function);
          if (!validationResult.valid) {
            console.error('[ERROR] Model 1 validation failed:', validationResult.error);
            setModel1ValidationError(validationResult.error || 'Validation failed');
            return false;
          }
          console.log('[DEBUG] Model 1 validation successful');
        } catch (error) {
          console.error('[ERROR] Failed to create Model 1:', error);
          setModel1ValidationError(`Error creating model: ${error}`);
          return false;
        }
      } else if (model1Type === "function" && model1Input.trim()) {
        model1Function = parseModelFunction(model1Input);
      } else if (model1Type === "url" && model1Input.trim()) {
        model1Function = randomModel;
      } else if (model1Type === "file") {
        model1Function = null;
        setModel1Input('');
      }
    } catch (error) {
      console.error("[ERROR] Error initializing Model 1:", error);
      console.error("[ERROR] Model 1 error stack:", error.stack);
      setModel1ValidationError(`Error: ${error}`);
      return false;
    }
    
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
    if (model1Function && model2Function) {
      console.log('[DEBUG] Both models initialized successfully');
      console.log('[DEBUG] Setting models in state...');
      
      // Set models in state
      setModels({
        model1: model1Function,
        model2: model2Function
      });
      
      // Wait for state update to complete
      await new Promise<void>((resolve) => {
        const checkState = () => {
          if (models.model1 && models.model2) {
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
  const makeModelMove = async (player: 1 | 2) => {
    console.log(`[DEBUG] Starting makeModelMove for player ${player}`);
    console.log(`[DEBUG] Game state: inProgress=${gameStateRef.current.inProgress}, over=${gameStateRef.current.over}`);
    console.log(`[DEBUG] Current board:`, JSON.stringify(boardRef.current));
    
    // Double check game state
    if (!gameStateRef.current.inProgress || gameStateRef.current.over) {
      console.log('[DEBUG] Game not in progress or already over, returning');
      console.log('[DEBUG] Current game state:', {
        inProgress: gameStateRef.current.inProgress,
        over: gameStateRef.current.over,
        board: boardRef.current
      });
      return;
    }
    
    // Get the current model and verify it's a function
    const currentModel = player === 1 ? models.model1 : models.model2;
    if (typeof currentModel !== 'function') {
      console.error(`[ERROR] Model ${player} is not a function:`, currentModel);
      setGameInProgress(false);
      setStatusMessage(`Error: ${player === 1 ? model1Name : model2Name} is not properly initialized`);
      return;
    }
    
    const playerStats = player === 1 ? model1Stats : model2Stats;
    const setPlayerStats = player === 1 ? setModel1Stats : setModel2Stats;
    
    console.log(`[DEBUG] Setting thinking state for player ${player}`);
    setStatusMessage(`${player === 1 ? model1Name : model2Name} is thinking...`);
    setModelThinking(player);
    
    // Set timeout for move (10 seconds)
    let timeoutTriggered = false;
    const timeoutId = window.setTimeout(() => {
      console.log(`[DEBUG] Timeout triggered for player ${player}`);
      timeoutTriggered = true;
      setPlayerStats({
        ...playerStats,
        timeouts: playerStats.timeouts + 1
      });
      
      // End game due to timeout
      const opponent = player === 1 ? 2 : 1;
      setWinResult({
        winner: opponent,
        winningCells: []
      });
      
      setGameOver(true);
      setGameInProgress(false);
      setModelThinking(null);
      setStatusMessage(`${player === 1 ? model1Name : model2Name} timed out! ${player === 1 ? model2Name : model1Name} wins!`);
    }, 10000);
    
    moveTimeoutRef.current = timeoutId;
    
    try {
      // Start timing the move
      const startTime = performance.now();
      
      // Create a copy of the current board state
      const currentBoard = [...boardRef.current];
      console.log(`[DEBUG] Calling model ${player} with board:`, JSON.stringify(currentBoard));
      const newBoard = await currentModel(currentBoard);
      console.log(`[DEBUG] Model ${player} returned board:`, JSON.stringify(newBoard));
      
      // Calculate move time
      const moveTime = performance.now() - startTime;
      
      // Clear timeout if move was made in time
      window.clearTimeout(timeoutId);
      moveTimeoutRef.current = null;
      
      // If timeout was triggered, ignore the result
      if (timeoutTriggered) {
        console.log(`[DEBUG] Timeout was triggered, ignoring result`);
        return;
      }
      
      // Clear thinking state
      console.log(`[DEBUG] Clearing thinking state for player ${player}`);
      setModelThinking(null);
      
      // Validate the move
      console.log(`[DEBUG] Validating move for player ${player}`);
      const isValidMove = validateMove(currentBoard, newBoard, player);
      console.log(`[DEBUG] Move validation result: ${isValidMove}`);
      
      if (isValidMove) {
        // Update the board with the valid move
        console.log(`[DEBUG] Updating board with valid move`);
        setBoard(newBoard);
        playSound('move');
        
        // Update stats with move time
        const updatedStats = updateStatsWithMove(playerStats, moveTime);
        
        console.log(`[DEBUG] Updating stats for player ${player}:`, {
          currentTotalMoves: playerStats.totalMoves,
          currentTotalTime: playerStats.totalTime,
          moveTime,
          newTotalMoves: updatedStats.totalMoves,
          newTotalTime: updatedStats.totalTime,
          newAverageTime: updatedStats.averageTime
        });
        
        setPlayerStats(updatedStats);
        
        // Check for game end conditions
        const result = checkWinner(newBoard);
        console.log(`[DEBUG] Game result:`, result);
        
        if (result.winner !== null || result.winningCells) {
          // Game over, someone won
          console.log(`[DEBUG] Game over - ${result.winner === 1 ? model1Name : model2Name} wins`);
          setWinResult(result);
          setGameOver(true);
          setGameInProgress(false);
          
          // Play victory sound with increased volume
          const audio = new Audio('/sounds/victory.mp3');
          audio.volume = 0.8;
          audio.play();
          
          // Update stats for winner and loser
          if (result.winner === 1) {
            setModel1Stats({
              ...model1Stats,
              wins: model1Stats.wins + 1
            });
            setModel2Stats({
              ...model2Stats,
              losses: model2Stats.losses + 1
            });
            setStatusMessage(`${model1Name} wins!`);
          } else {
            setModel2Stats({
              ...model2Stats,
              wins: model2Stats.wins + 1
            });
            setModel1Stats({
              ...model1Stats,
              losses: model1Stats.losses + 1
            });
            setStatusMessage(`${model2Name} wins!`);
          }
        } else if (newBoard.every(cell => cell !== null)) {
          // Game over, it's a draw
          console.log(`[DEBUG] Game over - Draw`);
          setGameOver(true);
          setGameInProgress(false);
          playSound('draw');
          
          // Update draw stats for both models
          setModel1Stats({
            ...model1Stats,
            draws: model1Stats.draws + 1
          });
          setModel2Stats({
            ...model2Stats,
            draws: model2Stats.draws + 1
          });
          
          setStatusMessage(`Game over! It's a draw.`);
        } else {
          // Game continues, switch players
          console.log(`[DEBUG] Game continues, switching to next player`);
          const nextPlayer = player === 1 ? 2 : 1;
          setCurrentPlayer(nextPlayer);
          
          // Let the next model make a move
          setTimeout(() => {
            console.log(`[DEBUG] Scheduling next move for player ${nextPlayer}`);
            console.log('[DEBUG] Game state before next move:', {
              inProgress: gameStateRef.current.inProgress,
              over: gameStateRef.current.over,
              board: newBoard
            });
            makeModelMove(nextPlayer);
          }, 500);
        }
      } else {
        // Invalid move
        console.log(`[DEBUG] Invalid move detected`);
        setPlayerStats({
          ...playerStats,
          invalidMoves: playerStats.invalidMoves + 1
        });
        
        // End game due to invalid move
        const opponent = player === 1 ? 2 : 1;
        setWinResult({
          winner: opponent,
          winningCells: []
        });
        
        setGameOver(true);
        setGameInProgress(false);
        playSound('error');
        setStatusMessage(`${player === 1 ? model1Name : model2Name} made an invalid move! ${player === 1 ? model2Name : model1Name} wins.`);
      }
    } catch (error) {
      // Clear timeout
      window.clearTimeout(timeoutId);
      moveTimeoutRef.current = null;
      setModelThinking(null);
      
      if (timeoutTriggered) {
        console.log(`[DEBUG] Timeout was triggered, ignoring error`);
        return;
      }
      
      console.error(`[ERROR] Model ${player} error:`, error);
      
      // Update crash stats
      setPlayerStats({
        ...playerStats,
        crashes: playerStats.crashes + 1
      });
      
      // End game due to crash
      const opponent = player === 1 ? 2 : 1;
      setWinResult({
        winner: opponent
      });
      
      setGameOver(true);
      setGameInProgress(false);
      playSound('error');
      setStatusMessage(`${player === 1 ? model1Name : model2Name} crashed! ${player === 1 ? model2Name : model1Name} wins.`);
    }
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
    if (!models.model1 || !models.model2) {
      console.error('[ERROR] Models not properly initialized');
      console.error('[ERROR] Model state:', {
        model1: !!models.model1,
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
      model1: !!models.model1,
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

  const handleCellClick = (index: number) => {
    if (!isPlayerTurn || board[index] !== null) return;
    
    const newBoard = [...board];
    newBoard[index] = 1; // Player is always 1 (X)
    setBoard(newBoard);
    setIsPlayerTurn(false);
    
    // AI move logic here
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
    setModel1Name("");
    setModel2Name("");
    
    // Clear model inputs
    setModel1Input("");
    setModel2Input("");
    
    // Reset model types to demo
    setModel1Type("demo");
    setModel2Type("demo");
    
    // Reset demo preferences
    setModel1Demo("center");
    setModel2Demo("corners");
    
    // Clear validation errors
    setModel1ValidationError(null);
    setModel2ValidationError(null);
    
    // Reset models
    setModels({
      model1: null,
      model2: null
    });
    
    // Reset stats
    setModel1Stats(initializeStats(""));
    setModel2Stats(initializeStats(""));
    
    // Clear localStorage
    localStorage.removeItem(`model_stats_${model1Name}`);
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
              Tic Tac Toe PlaygroundS
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
          {/* Left Side - Model X Config */}
          <div className="w-full lg:w-1/4">
            {!gameInProgress && !gameOver ? (
              <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent/30 shadow-cyber hover:shadow-cyber-glow transition-all duration-300 transform hover:scale-[1.02]">
                <h2 className="text-xl font-bold text-cyber-light mb-4 flex items-center">
                  <span className="text-cyber-accent mr-2 font-pixel">Model X</span>
                  <div className="w-2 h-2 bg-cyber-accent rounded-full animate-cyber-pulse"></div>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-cyber-light text-sm mb-2 font-pixel">Model Name</label>
                    <input
                      type="text"
                      value={model1Name}
                      onChange={(e) => setModel1Name(e.target.value)}
                      className="w-full bg-cyber-secondary/50 border-2 border-cyber-accent/30 rounded-xl px-4 py-2 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent focus:shadow-cyber-glow transition-all duration-300 font-mono"
                      placeholder="Enter model name"
                    />
                  </div>
                  <div>
                    <label className="block text-cyber-light text-sm mb-2 font-pixel">Model Type</label>
                    <Tabs value={model1Type} onValueChange={(v) => setModel1Type(v as any)} className="w-full">
                      <TabsList className="w-full bg-cyber-secondary/50 rounded-xl p-1 grid grid-cols-4 gap-1">
                        <TabsTrigger value="demo" className="data-[state=active]:bg-cyber-accent data-[state=active]:text-white rounded-lg font-pixel">Demo</TabsTrigger>
                        <TabsTrigger value="function" className="data-[state=active]:bg-cyber-accent data-[state=active]:text-white rounded-lg font-pixel">Function</TabsTrigger>
                        <TabsTrigger value="url" className="data-[state=active]:bg-cyber-accent data-[state=active]:text-white rounded-lg font-pixel">URL</TabsTrigger>
                        <TabsTrigger value="file" className="data-[state=active]:bg-cyber-accent data-[state=active]:text-white rounded-lg font-pixel">File</TabsTrigger>
                      </TabsList>
                      <TabsContent value="demo" className="pt-2">
                        <select 
                          value={model1Demo} 
                          onChange={(e) => setModel1Demo(e.target.value as any)}
                          className="w-full bg-cyber-secondary/50 border border-cyber-accent/30 rounded px-3 py-1.5 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent focus:shadow-cyber-glow transition-all duration-300"
                        >
                          <option value="center">Prefer Center</option>
                          <option value="corners">Prefer Corners</option>
                          <option value="random">Random Moves</option>
                        </select>
                      </TabsContent>
                      <TabsContent value="function" className="pt-2">
                        <Textarea 
                          placeholder="Enter JavaScript function here..."
                          value={model1Input}
                          onChange={(e) => setModel1Input(e.target.value)}
                          className="min-h-[100px] font-mono text-xs bg-cyber-secondary/50 text-cyber-light border-cyber-accent/30 focus:border-cyber-accent focus:shadow-cyber-glow transition-all duration-300"
                        />
                      </TabsContent>
                      <TabsContent value="url" className="pt-2">
                        <Input
                          placeholder="Enter TensorFlow.js model URL"
                          value={model1Input}
                          onChange={(e) => setModel1Input(e.target.value)}
                          className="bg-cyber-secondary/50 text-cyber-light text-sm border-cyber-accent/30 focus:border-cyber-accent focus:shadow-cyber-glow transition-all duration-300"
                        />
                      </TabsContent>
                      <TabsContent value="file" className="pt-2">
                        <ModelFileUpload 
                          onFileSelect={async (file) => {
                            try {
                              const loadedModel = await loadModelFromFile(file);
                              setModels({
                                model1: loadedModel,
                                model2: models.model2
                              });
                              setModel1Input('');
                              toast({
                                title: "Model loaded successfully",
                                description: "The model file has been loaded and is ready to use.",
                              });
                            } catch (error) {
                              console.error("Error loading model:", error);
                              setModel1ValidationError(`Failed to load model: ${error}`);
                            }
                          }}
                          disabled={gameInProgress}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  {model1ValidationError && (
                    <Alert variant="destructive" className="bg-cyber-warning/20 border-2 border-cyber-warning rounded-xl">
                      <AlertDescription className="font-pixel text-sm">{model1ValidationError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Model 1 Stats with updated styling */}
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-cyber-light mb-3 font-pixel">Model Statistics</h3>
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
                        <p className="text-cyber-accent text-xl font-bold font-mono">
                          {model1Stats.wins + model1Stats.losses + model1Stats.draws > 0 
                            ? `${Math.round((model1Stats.wins / (model1Stats.wins + model1Stats.losses + model1Stats.draws)) * 100)}%`
                            : '0%'}
                        </p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Timeouts</p>
                        <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.timeouts}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Coin Flips Won</p>
                        <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.coinFlipsWon || 0}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Total Time</p>
                        <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.totalTime.toFixed(0)}ms</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Avg. Time</p>
                        <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.averageTime.toFixed(0)}ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent/30 shadow-cyber hover:shadow-cyber-glow transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-cyber-accent">{model1Name || "Model X"}</h3>
                  <div className={`w-2 h-2 rounded-full ${modelThinking === 1 ? 'bg-cyber-accent animate-cyber-pulse' : 'bg-cyber-accent/30'}`}></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Wins</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.wins}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Losses</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.losses}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Draws</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.draws}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Win Rate</p>
                    <p className="text-cyber-accent text-lg font-bold">
                      {model1Stats.wins + model1Stats.losses + model1Stats.draws > 0 
                        ? `${Math.round((model1Stats.wins / (model1Stats.wins + model1Stats.losses + model1Stats.draws)) * 100)}%`
                        : '0%'}
                    </p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Invalid Moves</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.invalidMoves}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Timeouts</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.timeouts}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Crashes</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.crashes}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Total Moves</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.totalMoves}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Total Time</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.totalTime.toFixed(0)}ms</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-lg p-2">
                    <p className="text-cyber-light text-xs">Avg. Time</p>
                    <p className="text-cyber-accent text-lg font-bold">{model1Stats.averageTime.toFixed(0)}ms</p>
                  </div>
                </div>
              </div>
            )}
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
                            <span className="text-cyber-accent-2 font-bold">{winResult.winner === 1 ? (model1Name || "Model X") : (model2Name || "Model O")}</span> wins the match!
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
                            <span className="text-cyber-accent-2 font-bold">{modelThinking === 1 ? (model1Name || "Model X") : (model2Name || "Model O")}</span> is thinking...
                          </span>
                        ) : (
                          <span>
                            <span className="text-cyber-accent-2 font-bold">{currentPlayer === 1 ? (model1Name || "Model X") : (model2Name || "Model O")}</span>'s turn
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
                        <span className="text-cyber-accent-2 font-bold">{model1Name || "Model X"}</span> vs <span className="text-cyber-accent-2 font-bold">{model2Name || "Model O"}</span>
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
                      disabled={!isPlayerTurn || cell !== null}
                      className={`
                        aspect-square bg-cyber-secondary/50 border-2 border-l-cyber-accent/30 border-r-cyber-accent-2/30 rounded-xl 
                        text-4xl font-bold font-pixel flex items-center justify-center 
                        transition-all duration-300 ${getCellColor(cell)}
                        ${!isPlayerTurn || cell !== null
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
                                model1: models.model1,
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
