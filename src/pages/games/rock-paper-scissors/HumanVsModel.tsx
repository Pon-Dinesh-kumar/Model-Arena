import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { playSound } from "@/utils/sounds";

import ModelFileUpload from "@/components/ModelFileUpload";
import InfoModal from "@/components/InfoModal";

import {
  RPSChoice,
  RPSGameState,
  RPSResult,
  initializeRPSGame,
  determineRPSWinner,
  validateRPSChoice,
  ModelFunction,
  ModelStats,
  initializeStats,
  createRPSDemoModel,
  RPSDemoStrategy,
  validateModel,
  RPSModelFunction,
  isRPSModel
} from "@/utils/gameLogic";

import { loadModelFromFile } from "@/utils/modelIntegration";

const formatTime = (ms: number): string => {
  if (ms < 1) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
};

const formatAvgTime = (ms: number): string => {
  return `${Math.round(ms)}ms`;
};

const HumanVsModel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Game state
  const [gameState, setGameState] = useState<RPSGameState>(initializeRPSGame());
  const [gameInProgress, setGameInProgress] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winResult, setWinResult] = useState<{ winner: 1 | 2 | null; choice?: RPSChoice }>({
    winner: null
  });
  
  // Model state
  const [model, setModel] = useState<RPSModelFunction | null>(null);
  const [modelName, setModelName] = useState("Model O");
  const [modelType, setModelType] = useState<"demo" | "function" | "url" | "file">("demo");
  const [modelDemo, setModelDemo] = useState<RPSDemoStrategy>("random");
  const [modelInput, setModelInput] = useState('');
  const [modelValidationError, setModelValidationError] = useState<string | null>(null);
  const [modelThinking, setModelThinking] = useState<1 | 2 | null>(null);
  
  // UI state
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [flippedResult, setFlippedResult] = useState<1 | 2 | null>(null);
  const [statusMessage, setStatusMessage] = useState("Welcome to Rock Paper Scissors");
  const [isLoading, setIsLoading] = useState(false);
  
  // Match state
  const [matchCount, setMatchCount] = useState<1 | 5 | 10 | 20>(1);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  
  // Game statistics
  const [humanStats, setHumanStats] = useState<ModelStats>(() => initializeStats("You"));
  const [modelStats, setModelStats] = useState<ModelStats>(() => initializeStats(modelName));
  
  // Refs for immediate access
  const modelRef = useRef<RPSModelFunction | null>(null);
  const gameStateRef = useRef<RPSGameState>(initializeRPSGame());
  const moveTimeoutRef = useRef<number | null>(null);

  // Add additional refs for reliable state tracking
  const currentPlayerRef = useRef<1 | 2>(1);
  const gameInProgressRef = useRef(false);
  const gameOverRef = useRef(false);
  const modelThinkingRef = useRef<1 | 2 | null>(null);

  // Add model validation state
  const [modelValidated, setModelValidated] = useState(false);

  // Add moveInProgress ref after other refs
  const moveInProgressRef = useRef(false);

  // Update refs when states change
  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  useEffect(() => {
    gameInProgressRef.current = gameInProgress;
  }, [gameInProgress]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    modelThinkingRef.current = modelThinking;
  }, [modelThinking]);

  // Initialize or update model when settings change
  useEffect(() => {
    const initializeModel = async () => {
      setIsLoading(true);
      const initStartTime = performance.now();
      
      try {
        console.log('[DEBUG] Starting model initialization:', { 
          modelType, 
          modelDemo, 
          modelName,
          timestamp: new Date().toISOString()
        });
        
        let newModel: RPSModelFunction | null = null;

        switch (modelType) {
          case "demo":
            try {
              console.log('[DEBUG] Creating demo model...');
              newModel = createRPSDemoModel(modelName, modelDemo, 2);
              console.log('[DEBUG] Demo model created successfully:', {
                name: modelName,
                strategy: modelDemo,
                functionBody: newModel.toString()
              });
            } catch (error) {
              console.error('[DEBUG] Demo model creation failed:', {
                error: error.message,
                stack: error.stack,
                modelType,
                modelDemo
              });
              throw new Error(`Failed to create demo model: ${error.message}`);
            }
            break;

          case "function":
            if (modelInput.trim()) {
              try {
                console.log('[DEBUG] Creating function model from input...');
                const functionBody = `return ${modelInput.trim()}`;
                const modelFn = new Function(functionBody) as () => RPSModelFunction;
                newModel = modelFn();
                console.log('[DEBUG] Function model created successfully:', {
                  functionBody: newModel.toString()
                });
                
                const validationResult = await validateModel(newModel);
                if (!validationResult.valid) {
                  throw new Error(validationResult.error || 'Invalid model function');
                }
              } catch (error) {
                console.error('[DEBUG] Function model creation failed:', {
                  error: error.message,
                  stack: error.stack,
                  modelInput: modelInput.trim()
                });
                throw new Error(`Failed to create function model: ${error.message}`);
              }
            }
            break;

          case "url":
            if (modelInput.trim()) {
              try {
                console.log('[DEBUG] Fetching model from URL:', modelInput.trim());
                const response = await fetch(modelInput.trim());
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const modelCode = await response.text();
                console.log('[DEBUG] Model code fetched successfully, creating function...');
                
                const functionBody = `return ${modelCode}`;
                const modelFn = new Function(functionBody) as () => RPSModelFunction;
                newModel = modelFn();
                
                console.log('[DEBUG] URL model created successfully:', {
                  functionBody: newModel.toString()
                });
                
                const validationResult = await validateModel(newModel);
                if (!validationResult.valid) {
                  throw new Error(validationResult.error || 'Invalid model from URL');
                }
              } catch (error) {
                console.error('[DEBUG] URL model creation failed:', {
                  error: error.message,
                  stack: error.stack,
                  url: modelInput.trim(),
                  timestamp: new Date().toISOString()
                });
                throw new Error(`Failed to load model from URL: ${error.message}`);
              }
            }
            break;
        }

        // Always ensure we have a model, default to demo if none is set
        if (!newModel && modelType === "demo") {
          console.log('[DEBUG] Creating default demo model...');
          newModel = createRPSDemoModel(modelName, modelDemo, 2);
          console.log('[DEBUG] Default demo model created successfully');
        }

        if (newModel) {
          try {
            console.log('[DEBUG] Testing model with null state...');
            const testStartTime = performance.now();
            const testResult = await Promise.race([
              newModel(null),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Model test timeout')), 5000)
              )
            ]);
            const testDuration = performance.now() - testStartTime;
            
            console.log('[DEBUG] Model test completed:', {
              result: testResult,
              duration: `${testDuration}ms`
            });

            if (!testResult || !validateRPSChoice(testResult)) {
              throw new Error(`Invalid test result: ${testResult}`);
            }
            
            // Model passed all tests, update state and refs
            setModel(newModel);
            modelRef.current = newModel;
            setModelValidationError(null);
            
            const totalDuration = performance.now() - initStartTime;
            console.log('[DEBUG] Model initialization completed successfully:', {
              duration: `${totalDuration}ms`,
              modelType,
              modelName
            });
            
            toast({
              title: "Model Ready",
              description: `${modelName} has been initialized and is ready to play.`,
            });
          } catch (error) {
            console.error('[DEBUG] Model test failed:', {
              error: error.message,
              stack: error.stack,
              modelType,
              modelName,
              timestamp: new Date().toISOString()
            });
            throw new Error(`Model test failed: ${error.message}`);
          }
        } else {
          throw new Error('No valid model was created');
        }
      } catch (error) {
        const totalDuration = performance.now() - initStartTime;
        console.error('[DEBUG] Model initialization failed:', {
          error: error.message,
          stack: error.stack,
          duration: `${totalDuration}ms`,
          modelType,
          modelName,
          timestamp: new Date().toISOString()
        });
        
        setModel(null);
        modelRef.current = null;
        setModelValidationError(error.message);
        
        toast({
          title: "Model Error",
          description: `Failed to initialize model: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only skip initialization if game is in progress AND we already have a valid model
    if (gameInProgress && model && modelRef.current) {
      console.log('[DEBUG] Skipping model initialization - game in progress with valid model');
      return;
    }

    initializeModel();
  }, [modelType, modelDemo, modelInput, modelName, gameInProgress]);

  // Handle model type change
  const handleModelTypeChange = (type: "demo" | "function" | "url" | "file") => {
    if (gameInProgress) return;
    setModelType(type);
    setModelInput('');
    setModelValidationError('');
  };

  // Handle model input change
  const handleModelInputChange = (input: string) => {
    if (gameInProgress) return;
    setModelInput(input);
  };

  // Handle model name change
  const handleModelNameChange = (name: string) => {
    if (gameInProgress) return;
    setModelName(name);
  };

  // Handle demo strategy change
  const handleDemoStrategyChange = (strategy: RPSDemoStrategy) => {
    if (gameInProgress) return;
    setModelDemo(strategy);
  };

  // Update game state and ref together
  const updateGameState = (newState: RPSGameState) => {
    setGameState(newState);
    gameStateRef.current = newState;
  };

  // Handle human move
  const handleHumanMove = async (choice: RPSChoice) => {
    if (!gameInProgressRef.current || gameOverRef.current || currentPlayerRef.current !== 1) {
      console.log('[DEBUG] Human move conditions not met:', { 
        gameInProgress: gameInProgressRef.current, 
        gameOver: gameOverRef.current, 
        currentPlayer: currentPlayerRef.current 
      });
      return;
    }

    // Verify model is ready before proceeding
    if (!model || !modelRef.current) {
      console.error('[DEBUG] Model not ready for move');
      toast({
        title: "Model Error",
        description: "The model is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('[DEBUG] Processing human move:', choice);
    playSound('move');
    
    // Update game state with human's choice
    const updatedGameState = {
      ...gameStateRef.current,
      player1Choice: choice
    };
    console.log('[DEBUG] Updated game state with human move:', updatedGameState);
    
    try {
      // Update state and refs atomically
      updateGameState(updatedGameState);
      currentPlayerRef.current = 2;
      setCurrentPlayer(2);
      
      // Update human stats
      setHumanStats(prev => ({
        ...prev,
        totalMoves: prev.totalMoves + 1
      }));
      
      // Wait for next render to ensure state updates are reflected in the UI
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Verify state updates
      if (gameStateRef.current.player1Choice !== choice || currentPlayerRef.current !== 2) {
        console.error('[DEBUG] State update verification failed:', {
          expectedChoice: choice,
          actualChoice: gameStateRef.current.player1Choice,
          expectedPlayer: 2,
          actualPlayer: currentPlayerRef.current
        });
        throw new Error('State update verification failed');
      }
      
      console.log('[DEBUG] State updates verified, initiating model move');
      await handleModelMove(gameStateRef.current);
      
    } catch (error) {
      console.error('[DEBUG] Error in handleHumanMove:', error);
      toast({
        title: "Move Error",
        description: "An error occurred while processing your move. Please try again.",
        variant: "destructive",
      });
      // Reset state and refs on error
      currentPlayerRef.current = 1;
      setCurrentPlayer(1);
      const resetState = {
        ...gameStateRef.current,
        player1Choice: null
      };
      updateGameState(resetState);
    }
  };

  // Handle model move with enhanced error logging
  const handleModelMove = async (currentGameState: RPSGameState) => {
    // Prevent multiple simultaneous moves
    if (moveInProgressRef.current) {
      console.log('[DEBUG] Move already in progress, skipping');
      return;
    }

    moveInProgressRef.current = true;
    const moveStartTime = performance.now();

    try {
      console.log('[DEBUG] Starting model move:', {
        timestamp: new Date().toISOString(),
        currentGameState,
        modelThinking: modelThinkingRef.current,
        gameInProgress: gameInProgressRef.current,
        hasModel: !!modelRef.current,
        modelType,
        modelName
      });

      // Validate model and game state
      if (!modelRef.current) {
        console.error('[DEBUG] Model not initialized');
        throw new Error('Model not initialized. Please configure a model first.');
      }

      if (!gameInProgressRef.current) {
        console.error('[DEBUG] Game not in progress');
        throw new Error('Game is not in progress');
      }

      if (currentPlayerRef.current !== 2) {
        console.error('[DEBUG] Not model\'s turn:', {
          currentPlayer: currentPlayerRef.current,
          expectedPlayer: 2
        });
        throw new Error(`Not model's turn (current player: ${currentPlayerRef.current})`);
      }

      if (!currentGameState?.player1Choice) {
        console.error('[DEBUG] Invalid game state - missing player 1 choice');
        throw new Error('Invalid game state - missing player 1 choice');
      }

      setModelThinking(2);
      
      // Clear any existing timeout
      if (moveTimeoutRef.current) {
        window.clearTimeout(moveTimeoutRef.current);
      }

      // Set a timeout for model's move
      const timeoutPromise = new Promise<never>((_, reject) => {
        moveTimeoutRef.current = window.setTimeout(() => {
          reject(new Error('Model move timeout'));
        }, 5000); // 5 second timeout
      });

      // Race between model move and timeout
      const modelChoice = await Promise.race([
        modelRef.current(currentGameState),
        timeoutPromise
      ]);

      // Clear timeout if move was successful
      if (moveTimeoutRef.current) {
        window.clearTimeout(moveTimeoutRef.current);
      }

      // Validate model's choice
      if (!validateRPSChoice(modelChoice)) {
        throw new Error('Invalid move from model');
      }

      // Update game state
      const moveEndTime = performance.now();
      const moveTime = moveEndTime - moveStartTime;

      setModelStats(prev => ({
        ...prev,
        totalMoves: prev.totalMoves + 1,
        totalTime: prev.totalTime + moveTime,
        averageTime: (prev.totalTime + moveTime) / (prev.totalMoves + 1)
      }));

      // Update game state with model's choice
      const newGameState = {
        ...currentGameState,
        player2Choice: modelChoice
      };

      // Determine winner before updating state
      const result = determineRPSWinner(newGameState.player1Choice!, modelChoice);
      
      // Update all states in sequence
      updateGameState(newGameState);
      setModelThinking(null);
      currentPlayerRef.current = 1;
      setCurrentPlayer(1);

      // Convert RPSResult to winner number
      let winnerNumber: 1 | 2 | null = null;
      if (result === 'win') {
        winnerNumber = 1; // Human wins
      } else if (result === 'lose') {
        winnerNumber = 2; // Model wins
      }

      // Update stats based on result
      if (winnerNumber === 1) {
        setHumanStats(prev => ({ ...prev, wins: prev.wins + 1 }));
        setModelStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      } else if (winnerNumber === 2) {
        setHumanStats(prev => ({ ...prev, losses: prev.losses + 1 }));
        setModelStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      } else {
        setHumanStats(prev => ({ ...prev, draws: prev.draws + 1 }));
        setModelStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      }

      // Set winner and game over state
      setWinResult({ 
        winner: winnerNumber,
        choice: modelChoice 
      });
      setGameOver(true);

      console.log('[DEBUG] Model move completed successfully:', {
        choice: modelChoice,
        result,
        winnerNumber,
        moveTime,
        timestamp: new Date().toISOString(),
        gameState: newGameState,
        player1Choice: newGameState.player1Choice,
        player2Choice: modelChoice
      });

    } catch (error) {
      console.error('[ERROR] Model move failed:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Update error stats
      setModelStats(prev => ({
        ...prev,
        crashes: prev.crashes + 1
      }));

      // Reset game state
      setModelThinking(null);
      currentPlayerRef.current = 1;
      setCurrentPlayer(1);
      
      toast({
        title: "Error",
        description: `Model failed to make a move: ${error.message}`,
        variant: "destructive"
      });

    } finally {
      moveInProgressRef.current = false;
      if (moveTimeoutRef.current) {
        window.clearTimeout(moveTimeoutRef.current);
      }
      // Ensure modelThinking is cleared in finally block
      setModelThinking(null);
    }
  };

  // Validate model before starting game
  const validateModelBeforeStart = async (modelToValidate: RPSModelFunction | null): Promise<boolean> => {
    console.log('[DEBUG] Validating model before start:', {
      hasModel: !!modelToValidate,
      modelType,
      modelName,
      timestamp: new Date().toISOString()
    });

    if (!modelToValidate) {
      console.error('[DEBUG] No model to validate');
      toast({
        title: "Model Error",
        description: "No model available. Please configure a model first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Test the model with multiple states
      console.log('[DEBUG] Running comprehensive model validation...');
      
      // Test 1: Null state
      const nullStateResult = await Promise.race([
        modelToValidate(null),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      if (!validateRPSChoice(nullStateResult)) {
        throw new Error('Model failed null state test');
      }
      
      // Test 2: Empty game state
      const emptyState = initializeRPSGame();
      const emptyStateResult = await Promise.race([
        modelToValidate(emptyState),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      if (!validateRPSChoice(emptyStateResult)) {
        throw new Error('Model failed empty state test');
      }
      
      // Test 3: State with player 1 move
      const playerMoveState = {
        ...emptyState,
        player1Choice: 'rock' as RPSChoice
      };
      const playerMoveResult = await Promise.race([
        modelToValidate(playerMoveState),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      if (!validateRPSChoice(playerMoveResult)) {
        throw new Error('Model failed player move test');
      }

      console.log('[DEBUG] Model validation successful:', {
        nullStateResult,
        emptyStateResult,
        playerMoveResult
      });
      
      return true;
    } catch (error) {
      console.error('[DEBUG] Model validation failed:', {
        error: error.message,
        stack: error.stack,
        modelType,
        modelName
      });
      
      toast({
        title: "Model Validation Error",
        description: `Model validation failed: ${error.message}`,
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Add useEffect for model moves
  useEffect(() => {
    const handleModelTurn = async () => {
      if (!gameInProgressRef.current || gameOverRef.current || currentPlayerRef.current !== 2 || !modelRef.current) {
        return;
      }

      console.log('[DEBUG] Model turn triggered:', {
        timestamp: new Date().toISOString(),
        gameInProgress: gameInProgressRef.current,
        gameOver: gameOverRef.current,
        currentPlayer: currentPlayerRef.current,
        hasModel: !!modelRef.current
      });

      try {
        await handleModelMove(gameStateRef.current);
      } catch (error) {
        console.error('[ERROR] Model turn failed:', error);
        // Reset to human's turn on error
        currentPlayerRef.current = 1;
        setCurrentPlayer(1);
        setModelThinking(null);
      }
    };

    handleModelTurn();
  }, [currentPlayer, gameInProgress, gameOver, model]);

  // Update startGame with enhanced model validation
  const startGame = async () => {
    playSound('click');
    console.log('[DEBUG] Starting new game...');
    
    try {
      // Validate model first
      if (!model || !modelRef.current) {
        console.error('[DEBUG] Cannot start game - no model available');
        toast({
          title: "Model Error",
          description: "No model available. Please configure a model first.",
          variant: "destructive",
        });
        return;
      }

      // Test model with multiple states
      console.log('[DEBUG] Running comprehensive model validation...');
      
      // Test 1: Null state
      const nullStateResult = await Promise.race([
        modelRef.current(null),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      if (!validateRPSChoice(nullStateResult)) {
        throw new Error('Model failed null state test');
      }
      
      // Test 2: Empty game state
      const emptyState = initializeRPSGame();
      const emptyStateResult = await Promise.race([
        modelRef.current(emptyState),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      if (!validateRPSChoice(emptyStateResult)) {
        throw new Error('Model failed empty state test');
      }
      
      // Test 3: State with player 1 move
      const playerMoveState = {
        ...emptyState,
        player1Choice: 'rock' as RPSChoice
      };
      const playerMoveResult = await Promise.race([
        modelRef.current(playerMoveState),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      if (!validateRPSChoice(playerMoveResult)) {
        throw new Error('Model failed player move test');
      }

      console.log('[DEBUG] Model validation successful:', {
        nullStateResult,
        emptyStateResult,
        playerMoveResult
      });
      
      // Reset game state
      const initialGameState = initializeRPSGame();
      console.log('[DEBUG] Initialized game state:', JSON.stringify(initialGameState));
      
      // Set all game state at once to prevent race conditions
      console.log('[DEBUG] Setting initial game state...');
      setGameState(initialGameState);
      setGameOver(false);
      setWinResult({ winner: null });
      setGameInProgress(true);
      setCurrentMatch(0);
      setIsReplaying(true);
      setStatusMessage(`Starting match 1 of ${matchCount}...`);
      setCurrentPlayer(1); // Human always goes first
      
      toast({
        title: "Tournament Started",
        description: `Starting a tournament of ${matchCount} matches.`,
      });
    } catch (error) {
      console.error('[DEBUG] Error in startGame:', error);
      toast({
        title: "Game Error",
        description: `Failed to start game: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Clear data
  const clearData = () => {
    // Clear model names
    setModelName("Model O");
    
    // Clear model inputs
    setModelInput("");
    
    // Reset model types to demo
    setModelType("demo");
    
    // Reset demo preferences
    setModelDemo("random");
    
    // Clear validation errors
    setModelValidationError(null);
    
    // Reset model
    setModel(null);
    
    // Reset stats
    setHumanStats(initializeStats("You"));
    setModelStats(initializeStats(modelName));
    
    // Clear localStorage
    localStorage.removeItem(`model_stats_${modelName}`);
    
    // Reset game state
    setGameState(initializeRPSGame());
    setGameInProgress(false);
    setGameOver(false);
    setCurrentPlayer(1);
    setWinResult({ winner: null });
    setModelThinking(null);
    setStatusMessage("Welcome to Rock Paper Scissors");
    
    // Show confirmation toast
    toast({
      title: "Data Cleared",
      description: "All model data and configurations have been reset.",
    });
  };

  const resetGame = () => {
    playSound('click');
    // Clear any pending move timeouts
    if (moveTimeoutRef.current !== null) {
      window.clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = null;
    }
    
    // Reset game state but preserve stats
    setGameState(initializeRPSGame());
    setGameInProgress(false);
    setGameOver(false);
    setCurrentPlayer(1);
    setWinResult({ winner: null });
    setModelThinking(null);
    setStatusMessage("Ready for a new game");
  };

  const renderGameBoard = () => {
    const choices: RPSChoice[] = ["rock", "paper", "scissors"];
    
    return (
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto my-8">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => handleHumanMove(choice)}
            disabled={!gameInProgress || gameOver || currentPlayer !== 1}
            className={`
              aspect-square bg-cyber-secondary/50 border-2 border-l-cyber-accent/30 border-r-cyber-accent-2/30 rounded-xl
              text-4xl font-bold font-pixel flex items-center justify-center
              transition-all duration-300
              ${!gameInProgress || gameOver || currentPlayer !== 1
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-cyber-secondary hover:border-l-cyber-accent hover:border-r-cyber-accent-2 hover:shadow-cyber-glow transform hover:scale-105'
              }
              ${gameState.player1Choice === choice ? 'border-cyber-accent bg-cyber-accent/20' : ''}
            `}
          >
            {choice === "rock" ? "✊" : choice === "paper" ? "✋" : "✌️"}
          </button>
        ))}
      </div>
    );
  };

  // Effect to handle match completion
  useEffect(() => {
    const handleMatchComplete = async () => {
      if (currentMatch < matchCount - 1) {
        // Wait for 2-3 seconds to show victory animation
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        
        // Start next match
        setCurrentMatch(prev => prev + 1);
        setGameState(initializeRPSGame());
        setGameOver(false);
        setWinResult({ winner: null });
        setGameInProgress(true);
        setCurrentPlayer(1); // Human always goes first
        setStatusMessage(`Starting match ${currentMatch + 2} of ${matchCount}...`);
      } else {
        // All matches completed
        setIsReplaying(false);
        setStatusMessage("All matches completed!");
        
        toast({
          title: "Tournament Complete!",
          description: `${matchCount} matches completed. Check the statistics for results.`,
        });
      }
    };

    if (gameOver && isReplaying) {
      handleMatchComplete();
    }
  }, [gameOver, isReplaying, currentMatch, matchCount, modelName]);

  // Add renderGameStatus function
  const renderGameStatus = () => {
    if (gameOver) {
      const isTournamentComplete = currentMatch >= matchCount - 1;

      return (
        <div className="space-y-4">
          <div className="flex justify-center items-center gap-16">
            <div className="text-center">
              <div className={`text-8xl mb-4 transition-all duration-300 ${
                winResult.winner === 1 ? 'animate-glow-green' : ''
              }`}>
                {gameState.player1Choice === 'rock' ? '✊' : 
                 gameState.player1Choice === 'paper' ? '✋' : 
                 gameState.player1Choice === 'scissors' ? '✌️' : ''}
              </div>
              <div className="text-cyber-light text-sm font-pixel">Score: {humanStats.wins}</div>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4 text-cyber-accent-2 animate-battle-pulse">⚔️</div>
            </div>
            <div className="text-center">
              <div className={`text-8xl mb-4 transition-all duration-300 ${
                winResult.winner === 2 ? 'animate-glow-pink' : ''
              }`}>
                {gameState.player2Choice === 'rock' ? '✊' : 
                 gameState.player2Choice === 'paper' ? '✋' : 
                 gameState.player2Choice === 'scissors' ? '✌️' : ''}
              </div>
              <div className="text-cyber-light text-sm font-pixel">Score: {modelStats.wins}</div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-cyber-accent text-lg font-medium font-pixel">
              {isTournamentComplete ? (
                humanStats.wins > modelStats.wins ? (
                  <span>
                    <span className="text-cyber-accent-2 font-bold">You</span> win the tournament!
                  </span>
                ) : modelStats.wins > humanStats.wins ? (
                  <span>
                    <span className="text-cyber-accent-2 font-bold">{modelName}</span> wins the tournament!
                  </span>
                ) : (
                  "Tournament ended in a draw!"
                )
              ) : (
                winResult.winner === 1 ? (
                  <span>
                    <span className="text-cyber-accent-2 font-bold">You</span> win the match!
                  </span>
                ) : winResult.winner === 2 ? (
                  <span>
                    <span className="text-cyber-accent-2 font-bold">{modelName}</span> wins the match!
                  </span>
                ) : (
                  "Game ended in a draw!"
                )
              )}
            </p>
            {isReplaying && !isTournamentComplete && (
              <p className="text-cyber-light/80 text-sm font-pixel mt-2">
                Match {currentMatch + 1} of {matchCount}
              </p>
            )}
            {isTournamentComplete && (
              <p className="text-cyber-light/80 text-sm font-pixel mt-2">
                Final Score: You ({humanStats.wins}) - ({modelStats.wins}) {modelName}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (gameInProgress) {
      return (
        <div className="space-y-2">
          <div className="flex justify-center items-center gap-16">
            <div className="text-center">
              <div className={`text-8xl mb-4 transition-all duration-300 ${
                currentPlayer === 1 ? 'opacity-100' : 'opacity-70'
              }`}>
                {gameState.player1Choice ? (
                  gameState.player1Choice === 'rock' ? '✊' : 
                  gameState.player1Choice === 'paper' ? '✋' : '✌️'
                ) : '❓'}
              </div>
              <div className="text-cyber-light text-sm font-pixel">Score: {humanStats.wins}</div>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4 text-cyber-accent-2 animate-battle-pulse">⚔️</div>
            </div>
            <div className="text-center">
              <div className={`text-8xl mb-4 transition-all duration-300 ${
                currentPlayer === 2 ? 'opacity-100' : 'opacity-70'
              }`}>
                {gameState.player2Choice ? (
                  gameState.player2Choice === 'rock' ? '✊' : 
                  gameState.player2Choice === 'paper' ? '✋' : '✌️'
                ) : '❓'}
              </div>
              <div className="text-cyber-light text-sm font-pixel">Score: {modelStats.wins}</div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-cyber-accent text-2xl font-bold font-pixel">
              {showCoinFlip ? (
                "Flipping coin..."
              ) : (
                `Match ${currentMatch + 1} of ${matchCount}`
              )}
            </p>
            {!showCoinFlip && (
              <p className="text-cyber-light/80 text-sm font-pixel mt-2">
                {currentPlayer === 1 ? "Your turn!" : `${modelName} is thinking...`}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center gap-16">
          <div className="text-center">
            <div className="text-8xl mb-4 opacity-60">❓</div>
            <div className="text-cyber-light text-sm font-pixel">Score: 0</div>
          </div>
          <div className="text-center">
            <div className="text-6xl mb-4 text-cyber-accent-2 opacity-60">⚔️</div>
          </div>
          <div className="text-center">
            <div className="text-8xl mb-4 opacity-60">❓</div>
            <div className="text-cyber-light text-sm font-pixel">Score: 0</div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-cyber-accent text-lg font-medium font-pixel">
            Ready to start a new game
          </p>
          <p className="text-cyber-light/80 text-sm font-pixel">
            <span className="text-cyber-accent-2 font-bold">You</span> vs{" "}
            <span className="text-cyber-accent-2 font-bold">{modelName}</span>
          </p>
        </div>
      </div>
    );
  };

  // Update the stats display in the model configuration panel
  const renderModelStats = () => (
    <div className="pt-4">
      <h3 className="text-lg font-bold text-cyber-light mb-3 font-pixel">Model Statistics</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Wins</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">{modelStats.wins}</p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Losses</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">{modelStats.losses}</p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Draws</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">{modelStats.draws}</p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Win Rate</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">
            {modelStats.wins + modelStats.losses + modelStats.draws > 0 
              ? `${Math.round((modelStats.wins / (modelStats.wins + modelStats.losses + modelStats.draws)) * 100)}%`
              : '0%'}
          </p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Invalid Moves</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">{modelStats.invalidMoves}</p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Timeouts</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">{modelStats.timeouts}</p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Crashes</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">{modelStats.crashes}</p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Total Moves</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">{modelStats.totalMoves}</p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Total Time</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">
            {modelStats.totalTime > 1000 
              ? `${(modelStats.totalTime / 1000).toFixed(1)}s`
              : `${Math.round(modelStats.totalTime || 0)}ms`}
          </p>
        </div>
        <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent-2/30 hover:border-cyber-accent-2 hover:shadow-cyber-glow-pink transition-all duration-300">
          <p className="text-cyber-light text-xs font-pixel">Avg. Time</p>
          <p className="text-cyber-accent-2 text-xl font-bold font-mono">
            {modelStats.totalMoves > 0 
              ? `${Math.round((modelStats.totalTime || 0) / modelStats.totalMoves)}ms`
              : '0ms'}
          </p>
        </div>
      </div>
    </div>
  );

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
            onClick={() => navigate('/games/rock-paper-scissors')} 
            className="glass-button font-pixel px-4 py-2 hover:scale-105 transition-all duration-300"
          >
            ← Back
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Model Arena Logo" className="h-12 w-12" />
            <div className="text-2xl font-bold bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text font-pixel">
              Rock Paper Scissors - Human vs Model
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
                <h2 className="text-xl font-bold text-cyber-accent font-pixel">You</h2>
              </div>
              <div className="w-full mt-2">
                <h3 className="text-lg font-bold text-cyber-light mb-3 font-pixel">Your Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Wins</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{humanStats.wins}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Losses</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{humanStats.losses}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Draws</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{humanStats.draws}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Win Rate</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{humanStats.wins + humanStats.losses + humanStats.draws > 0 ? `${Math.round((humanStats.wins / (humanStats.wins + humanStats.losses + humanStats.draws)) * 100)}%` : '0%'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Game Status */}
          <div className="w-full lg:w-2/4">
            <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-l-cyber-accent border-r-cyber-accent-2 shadow-cyber hover:shadow-cyber-glow transition-all duration-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-cyber-light mb-3 font-pixel">Game Status</h2>
                <div className="bg-cyber-secondary/30 rounded-xl p-8 border-2 border-l-cyber-accent/20 border-r-cyber-accent-2/20">
                  {renderGameStatus()}
                </div>
              </div>

              {/* Game Board - RPS Choices */}
              {gameInProgress && !gameOver && currentPlayer === 1 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-cyber-light mb-4 font-pixel text-center">Choose Your Move</h3>
                  <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                    {["rock", "paper", "scissors"].map((choice) => (
                      <button
                        key={choice}
                        onClick={() => handleHumanMove(choice as RPSChoice)}
                        className={`
                          aspect-square bg-cyber-secondary/50 border-2 border-l-cyber-accent/30 border-r-cyber-accent-2/30 rounded-xl
                          text-4xl font-bold font-pixel flex items-center justify-center
                          transition-all duration-300 hover:bg-cyber-secondary hover:border-l-cyber-accent hover:border-r-cyber-accent-2 
                          hover:shadow-cyber-glow transform hover:scale-105
                          ${gameState.player1Choice === choice ? 'border-cyber-accent bg-cyber-accent/20' : ''}
                        `}
                      >
                        {choice === "rock" ? "✊" : choice === "paper" ? "✋" : "✌️"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Controls */}
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
                        setGameState(initializeRPSGame());
                        setWinResult({ winner: null });
                      }}
                      className="flex-1 px-6 py-4 rounded-xl text-cyber-light font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm font-pixel"
                    >
                      Select Models
                    </Button>
                  </div>
                ) : gameInProgress ? (
                  <Button
                    onClick={resetGame}
                    className="px-6 py-4 rounded-xl text-cyber-light font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm font-pixel"
                  >
                    Reset Game
                  </Button>
                ) : (
                  <div className="flex gap-4 justify-center">
                    <div className="flex-1 flex gap-4">
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
                      <Button
                        onClick={startGame}
                        disabled={isLoading}
                        className="flex-1 px-6 py-4 rounded-xl text-cyber-light font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm font-pixel"
                      >
                        Fight!
                      </Button>
                      <Button
                        onClick={clearData}
                        className="flex-1 px-6 py-4 rounded-xl text-cyber-light font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm font-pixel"
                      >
                        Clear Data
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Model Config */}
          <div className="w-full lg:w-1/4">
            {!gameInProgress && !gameOver ? (
              <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent-2/30 shadow-cyber-glow-pink hover:shadow-cyber-glow-pink hover:animate-cyber-glow-pink transition-all duration-300 transform hover:scale-[1.02]">
                <h2 className="text-xl font-bold text-cyber-light mb-4 flex items-center">
                  <span className="text-cyber-accent-2 mr-2 font-pixel">{modelName}</span>
                  <div className="w-2 h-2 bg-cyber-accent-2 rounded-full animate-cyber-pulse"></div>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-cyber-light text-sm mb-2 font-pixel">Model Name</label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full bg-cyber-secondary/50 border-2 border-cyber-accent-2/30 rounded-xl px-4 py-2 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent-2 focus:shadow-cyber-glow-pink transition-all duration-300 font-mono"
                      placeholder="Enter model name"
                    />
                  </div>
                  <div>
                    <label className="block text-cyber-light text-sm mb-2 font-pixel">Model Type</label>
                    <Tabs value={modelType} onValueChange={(v) => setModelType(v as any)} className="w-full">
                      <TabsList className="w-full bg-cyber-secondary/50 rounded-xl p-1 grid grid-cols-4 gap-1">
                        <TabsTrigger value="demo" className="data-[state=active]:bg-cyber-accent-2 data-[state=active]:text-white rounded-lg font-pixel">Demo</TabsTrigger>
                        <TabsTrigger value="function" className="data-[state=active]:bg-cyber-accent-2 data-[state=active]:text-white rounded-lg font-pixel">Function</TabsTrigger>
                        <TabsTrigger value="url" className="data-[state=active]:bg-cyber-accent-2 data-[state=active]:text-white rounded-lg font-pixel">URL</TabsTrigger>
                        <TabsTrigger value="file" className="data-[state=active]:bg-cyber-accent-2 data-[state=active]:text-white rounded-lg font-pixel">File</TabsTrigger>
                      </TabsList>
                      <TabsContent value="demo" className="pt-2">
                        <select 
                          value={modelDemo} 
                          onChange={(e) => setModelDemo(e.target.value as RPSDemoStrategy)}
                          className="w-full bg-cyber-secondary/50 border-2 border-cyber-accent-2/30 rounded-xl px-4 py-2 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent-2 focus:shadow-cyber-glow-pink transition-all duration-300 font-pixel"
                        >
                          <option value="random">Random</option>
                          <option value="pattern">Pattern</option>
                          <option value="counter">Counter</option>
                          <option value="adaptive">Adaptive</option>
                        </select>
                      </TabsContent>
                      <TabsContent value="function" className="pt-2">
                        <Textarea
                          value={modelInput}
                          onChange={(e) => setModelInput(e.target.value)}
                          placeholder="Enter your model function here..."
                          className="w-full bg-cyber-secondary/50 border-2 border-cyber-accent-2/30 rounded-xl px-4 py-2 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent-2 focus:shadow-cyber-glow-pink transition-all duration-300 font-mono min-h-[100px]"
                        />
                      </TabsContent>
                      <TabsContent value="url" className="pt-2">
                        <Input
                          value={modelInput}
                          onChange={(e) => setModelInput(e.target.value)}
                          placeholder="Enter model URL..."
                          className="w-full bg-cyber-secondary/50 border-2 border-cyber-accent-2/30 rounded-xl px-4 py-2 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent-2 focus:shadow-cyber-glow-pink transition-all duration-300 font-mono"
                        />
                      </TabsContent>
                      <TabsContent value="file" className="pt-2">
                        <ModelFileUpload 
                          onFileSelect={(file) => {
                            loadModelFromFile(file)
                              .then(loadedModel => {
                                // Validate that it's an RPS model
                                if (!isRPSModel(loadedModel)) {
                                  throw new Error('Invalid model type: Model must be an RPS model');
                                }
                                // Cast to RPSModelFunction since we've validated it
                                setModel(loadedModel as RPSModelFunction);
                                setModelValidationError(null);
                              })
                              .catch(error => {
                                setModelValidationError(error.message);
                              });
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  {modelValidationError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>{modelValidationError}</AlertDescription>
                    </Alert>
                  )}
                  {renderModelStats()}
                </div>
              </div>
            ) : (
              <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent-2/30 shadow-cyber-glow-pink hover:shadow-cyber-glow-pink hover:animate-cyber-glow-pink transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-cyber-accent-2 font-pixel">{modelName}</h3>
                </div>
                {renderModelStats()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanVsModel; 