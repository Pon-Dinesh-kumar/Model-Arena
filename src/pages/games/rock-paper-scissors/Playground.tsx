import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { playSound } from "@/utils/sounds";
import RPSBoard from "@/components/RPSBoard";
import ModelStats from "@/components/ModelStats";
import InfoModal from "@/components/InfoModal";
import ModelFileUpload from "@/components/ModelFileUpload";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
  createRPSDemoModel,
  RPSDemoStrategy
} from "@/utils/gameLogic";

import { loadModelFromFile } from "@/utils/modelIntegration";

const Playground = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Game state
  const [gameState, setGameState] = useState<RPSGameState>(initializeRPSGame());
  const [gameInProgress, setGameInProgress] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [modelThinking, setModelThinking] = useState<1 | 2 | null>(null);
  const [matchCount, setMatchCount] = useState<1 | 5 | 10 | 20>(1);
  
  // Model state
  const [models, setModels] = useState<{
    model1: ModelFunction | null;
    model2: ModelFunction | null;
  }>({
    model1: null,
    model2: null
  });
  const [model1Name, setModel1Name] = useState("Model X");
  const [model2Name, setModel2Name] = useState("Model Y");
  const [model1Type, setModel1Type] = useState<"demo" | "function" | "url" | "file">("demo");
  const [model2Type, setModel2Type] = useState<"demo" | "function" | "url" | "file">("demo");
  const [model1Demo, setModel1Demo] = useState<RPSDemoStrategy>("random");
  const [model2Demo, setModel2Demo] = useState<RPSDemoStrategy>("random");
  const [model1Input, setModel1Input] = useState('');
  const [model2Input, setModel2Input] = useState('');
  const [model1ValidationError, setModel1ValidationError] = useState('');
  const [model2ValidationError, setModel2ValidationError] = useState('');
  
  // Game statistics
  const [model1Stats, setModel1Stats] = useState<ModelStatsType>(() => initializeStats(model1Name));
  const [model2Stats, setModel2Stats] = useState<ModelStatsType>(() => initializeStats(model2Name));

  // Initialize models
  useEffect(() => {
    if (model1Type === "demo") {
      const demoModel1 = createRPSDemoModel(model1Name, model1Demo, 1);
      setModels(prev => ({ ...prev, model1: demoModel1 }));
    }
    if (model2Type === "demo") {
      const demoModel2 = createRPSDemoModel(model2Name, model2Demo, 2);
      setModels(prev => ({ ...prev, model2: demoModel2 }));
    }
  }, [model1Type, model2Type, model1Demo, model2Demo, model1Name, model2Name]);

  // Effect to handle model moves
  useEffect(() => {
    if (gameInProgress && !gameOver) {
      handleModelMove(currentPlayer);
    }
  }, [currentPlayer, gameInProgress, gameOver]);

  // Effect to handle match completion and start new matches
  useEffect(() => {
    const handleMatchComplete = async () => {
      if (gameOver && isReplaying && currentMatch < matchCount - 1) {
        // Wait for 2 seconds to show the result
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Start next match
        setCurrentMatch(prev => prev + 1);
        setGameState(initializeRPSGame());
        setGameOver(false);
        setGameInProgress(true);
        setCurrentPlayer(1);
      } else if (gameOver && isReplaying && currentMatch >= matchCount - 1) {
        // All matches completed
        setIsReplaying(false);
        toast({
          title: "Tournament Complete!",
          description: `${matchCount} matches completed. Check the statistics for results.`,
        });
      }
    };

    handleMatchComplete();
  }, [gameOver, isReplaying, currentMatch, matchCount]);

  // Start new game
  const startGame = () => {
    playSound('click');
    setGameState(initializeRPSGame());
    setGameInProgress(true);
    setGameOver(false);
    setCurrentPlayer(1);
    setCurrentMatch(0);
    setIsReplaying(true);
    handleModelMove(1); // Start with Model X's move

    toast({
      title: "Tournament Started",
      description: `Starting a tournament of ${matchCount} matches.`,
    });
  };

  // Clear data
  const clearData = () => {
    playSound('click');
    setGameState(initializeRPSGame());
    setGameInProgress(false);
    setGameOver(false);
    setCurrentPlayer(1);
    setCurrentMatch(0);
    setIsReplaying(false);
    setModel1Stats(initializeStats(model1Name));
    setModel2Stats(initializeStats(model2Name));

    toast({
      title: "Data Cleared",
      description: "All game data and statistics have been reset.",
    });
  };

  // Handle model moves
  const handleModelMove = async (player: 1 | 2) => {
    if (!gameInProgress || gameOver) return;

    const model = player === 1 ? models.model1 : models.model2;
    if (!model) return;

    try {
      setModelThinking(player);
      const startTime = performance.now();
      
      // Get model's choice
      const modelChoice = await model(null);
      
      const moveTime = performance.now() - startTime;
      setModelThinking(null);
      
      // Update timing stats
      const playerStats = player === 1 ? model1Stats : model2Stats;
      const setPlayerStats = player === 1 ? setModel1Stats : setModel2Stats;
      
      setPlayerStats(prev => ({
        ...prev,
        totalMoves: prev.totalMoves + 1,
        totalTime: prev.totalTime + moveTime,
        averageTime: (prev.totalTime + moveTime) / (prev.totalMoves + 1)
      }));

      if (validateRPSChoice(modelChoice)) {
        // Add a small delay before showing the move
        await new Promise(resolve => setTimeout(resolve, 250));
        
        setGameState(prev => ({
          ...prev,
          [`player${player}Choice`]: modelChoice
        }));

        // If both models have made their choices, determine the winner
        if (
          (player === 1 && gameState.player2Choice) ||
          (player === 2 && gameState.player1Choice)
        ) {
          const choice1 = player === 1 ? modelChoice : gameState.player1Choice;
          const choice2 = player === 2 ? modelChoice : gameState.player2Choice;
          
          if (choice1 && choice2) {
            const result = determineRPSWinner(choice1, choice2);
            
            // Update scores and stats
            setGameState(prev => ({
              ...prev,
              result,
              player1Score: result === 'win' ? prev.player1Score + 1 : prev.player1Score,
              player2Score: result === 'lose' ? prev.player2Score + 1 : prev.player2Score,
              round: prev.round + 1
            }));

            if (result === 'win') {
              setModel1Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
              setModel2Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
            } else if (result === 'lose') {
              setModel1Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
              setModel2Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
            } else {
              setModel1Stats(prev => ({ ...prev, draws: prev.draws + 1 }));
              setModel2Stats(prev => ({ ...prev, draws: prev.draws + 1 }));
            }

            // End current match with a delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            setGameOver(true);
            setGameInProgress(false);
          }
        } else {
          setCurrentPlayer(player === 1 ? 2 : 1);
        }
      } else {
        // Invalid move
        setPlayerStats(prev => ({
          ...prev,
          invalidMoves: prev.invalidMoves + 1
        }));
        
        // End match due to invalid move
        setGameOver(true);
        setGameInProgress(false);
        
        const winner = player === 1 ? 2 : 1;
        setGameState(prev => ({
          ...prev,
          result: winner === 1 ? 'win' : 'lose'
        }));
        
        if (winner === 1) {
          setModel1Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
          setModel2Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
        } else {
          setModel1Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
          setModel2Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
        }
        
        toast({
          title: "Invalid Move",
          description: `${player === 1 ? model1Name : model2Name} made an invalid move and lost the match.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Model ${player} error:`, error);
      
      // Update crash stats
      const playerStats = player === 1 ? model1Stats : model2Stats;
      const setPlayerStats = player === 1 ? setModel1Stats : setModel2Stats;
      
      setPlayerStats(prev => ({
        ...prev,
        crashes: prev.crashes + 1
      }));
      
      // End match due to crash
      setGameOver(true);
      setGameInProgress(false);
      
      const winner = player === 1 ? 2 : 1;
      setGameState(prev => ({
        ...prev,
        result: winner === 1 ? 'win' : 'lose'
      }));
      
      if (winner === 1) {
        setModel1Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
        setModel2Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
      } else {
        setModel1Stats(prev => ({ ...prev, losses: prev.losses + 1 }));
        setModel2Stats(prev => ({ ...prev, wins: prev.wins + 1 }));
      }
      
      toast({
        title: "Model Error",
        description: `${player === 1 ? model1Name : model2Name} crashed and lost the match.`,
        variant: "destructive",
      });
    }
  };

  // Game status section
  const renderGameStatus = () => {
    if (gameOver) {
      const isTournamentComplete = currentMatch >= matchCount - 1;
      const tournamentWinner = isTournamentComplete ? 
        (model1Stats.wins > model2Stats.wins ? 'model1' : 
         model2Stats.wins > model1Stats.wins ? 'model2' : 'draw') : null;

      return (
        <div className="space-y-4">
          <div className="flex justify-center items-center gap-16">
            <div className="text-center">
              <div className={`text-8xl mb-4 transition-all duration-300 ${
                gameState.result === 'win' ? 'animate-glow-green' : ''
              }`}>
                {gameState.player1Choice === 'rock' ? '✊' : 
                 gameState.player1Choice === 'paper' ? '✋' : 
                 gameState.player1Choice === 'scissors' ? '✌️' : ''}
              </div>
              <div className="text-cyber-light text-sm font-pixel">Score: {model1Stats.wins}</div>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4 text-cyber-accent-2 animate-battle-pulse">⚔️</div>
            </div>
            <div className="text-center">
              <div className={`text-8xl mb-4 transition-all duration-300 ${
                gameState.result === 'lose' ? 'animate-glow-pink' : ''
              }`}>
                {gameState.player2Choice === 'rock' ? '✊' : 
                 gameState.player2Choice === 'paper' ? '✋' : 
                 gameState.player2Choice === 'scissors' ? '✌️' : ''}
              </div>
              <div className="text-cyber-light text-sm font-pixel">Score: {model2Stats.wins}</div>
            </div>
          </div>
          <div>
            <p className="text-cyber-accent text-lg font-medium font-pixel">
              {isTournamentComplete ? (
                tournamentWinner === 'model1' ? (
                  <span>
                    <span className="text-cyber-accent-2 font-bold">{model1Name || "Model X"}</span> wins the tournament!
                  </span>
                ) : tournamentWinner === 'model2' ? (
                  <span>
                    <span className="text-cyber-accent-2 font-bold">{model2Name || "Model Y"}</span> wins the tournament!
                  </span>
                ) : (
                  "Tournament ended in a draw!"
                )
              ) : (
                gameState.result === 'win' ? (
                  <span>
                    <span className="text-cyber-accent-2 font-bold">{model1Name || "Model X"}</span> wins the match!
                  </span>
                ) : gameState.result === 'lose' ? (
                  <span>
                    <span className="text-cyber-accent-2 font-bold">{model2Name || "Model Y"}</span> wins the match!
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
                Final Score: {model1Name || "Model X"} ({model1Stats.wins}) - ({model2Stats.wins}) {model2Name || "Model Y"}
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
              <div className="text-8xl mb-4 transition-all duration-300">❓</div>
              <div className="text-cyber-light text-sm font-pixel">Score: {model1Stats.wins}</div>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4 text-cyber-accent-2 animate-battle-pulse">⚔️</div>
            </div>
            <div className="text-center">
              <div className="text-8xl mb-4 transition-all duration-300">❓</div>
              <div className="text-cyber-light text-sm font-pixel">Score: {model2Stats.wins}</div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-cyber-accent text-2xl font-bold font-pixel">
              Match - {currentMatch + 1} of {matchCount}
            </p>
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
        <div>
          <p className="text-cyber-accent text-lg font-medium font-pixel">
            Ready to start a new game
          </p>
          <p className="text-cyber-light/80 text-sm font-pixel">
            <span className="text-cyber-accent-2 font-bold">{model1Name || "Model X"}</span> vs{" "}
            <span className="text-cyber-accent-2 font-bold">{model2Name || "Model Y"}</span>
          </p>
        </div>
      </div>
    );
  };

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
              Rock Paper Scissors Playground
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
                          onChange={(e) => setModel1Demo(e.target.value as RPSDemoStrategy)}
                          className="w-full bg-cyber-secondary/50 border border-cyber-accent/30 rounded px-3 py-1.5 text-cyber-light text-sm focus:outline-none focus:border-cyber-accent focus:shadow-cyber-glow transition-all duration-300"
                        >
                          <option value="random">Random</option>
                          <option value="pattern">Pattern</option>
                          <option value="counter">Counter</option>
                          <option value="adaptive">Adaptive</option>
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

                  <div className="pt-4">
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
                        <p className="text-cyber-light text-xs font-pixel">Invalid Moves</p>
                        <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.invalidMoves}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Timeouts</p>
                        <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.timeouts}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Crashes</p>
                        <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.crashes}</p>
                      </div>
                      <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                        <p className="text-cyber-light text-xs font-pixel">Total Moves</p>
                        <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.totalMoves}</p>
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
                  <h3 className="text-lg font-bold text-cyber-accent font-pixel">{model1Name || "Model X"}</h3>
                </div>
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
                    <p className="text-cyber-light text-xs font-pixel">Invalid Moves</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.invalidMoves}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Timeouts</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.timeouts}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Crashes</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.crashes}</p>
                  </div>
                  <div className="bg-cyber-secondary/50 rounded-xl p-3 border border-cyber-accent/30 hover:border-cyber-accent hover:shadow-cyber-glow transition-all duration-300">
                    <p className="text-cyber-light text-xs font-pixel">Total Moves</p>
                    <p className="text-cyber-accent text-xl font-bold font-mono">{model1Stats.totalMoves}</p>
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
            )}
          </div>

          {/* Game Board - Center */}
          <div className="w-full lg:w-2/4">
            <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-l-cyber-accent border-r-cyber-accent-2 shadow-cyber hover:shadow-cyber-glow transition-all duration-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-cyber-light mb-3 font-pixel">Game Status</h2>
                <div className="bg-cyber-secondary/30 rounded-xl p-8 border-2 border-l-cyber-accent/20 border-r-cyber-accent-2/20">
                  {renderGameStatus()}
                </div>
              </div>

              {/* Game Controls */}
              <div className="mt-8 text-center">
                {gameOver ? (
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={startGame}
                      className="flex-1 px-6 py-4 rounded-xl text-cyber-light font-bold text-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm font-pixel"
                    >
                      Rematch
                    </Button>
                    <Button
                      onClick={() => {
                        setGameInProgress(false);
                        setGameOver(false);
                        setGameState(initializeRPSGame());
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
                        onClick={gameInProgress ? clearData : startGame}
                        className={`
                          flex-1 px-8 py-4 rounded-xl text-cyber-light font-bold text-lg 
                          transform hover:scale-105 transition-all duration-300 font-pixel
                          bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 border-2 border-[#FF3CBD] hover:border-[#00F2A9] backdrop-blur-sm
                        `}
                      >
                        {gameInProgress ? "Reset Game" : "Fight!"}
                      </Button>
                    </div>
                    {!gameInProgress && !gameOver && (
                      <Button
                        onClick={clearData}
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

          {/* Right Side - Model Y Config */}
          <div className="w-full lg:w-1/4">
            {!gameInProgress && !gameOver ? (
              <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent-2/30 shadow-cyber-glow-pink hover:shadow-cyber-glow-pink hover:animate-cyber-glow-pink transition-all duration-300 transform hover:scale-[1.02]">
                <h2 className="text-xl font-bold text-cyber-light mb-4 flex items-center">
                  <span className="text-cyber-accent-2 mr-2 font-pixel">Model Y</span>
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
                          onChange={(e) => setModel2Demo(e.target.value as RPSDemoStrategy)}
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

                  <div className="pt-4">
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
                </div>
              </div>
            ) : (
              <div className="bg-cyber-primary/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyber-accent-2/30 shadow-cyber-glow-pink hover:shadow-cyber-glow-pink hover:animate-cyber-glow-pink transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-cyber-accent-2 font-pixel">{model2Name || "Model Y"}</h3>
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