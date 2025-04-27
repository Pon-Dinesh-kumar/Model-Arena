import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const gameImages: Record<string, string> = {
  tictactoe: "/games/tictactoe-3d.png",
  chess: "/games/chess.png",
  "rock-paper-scissors": "/games/rps.png",
  checkers: "/games/checkers.png",
};

const modeData = [
  {
    key: 'playground',
    title: "Model Playground",
    description: "Test your AI models against each other in a controlled environment.",
    icon: "🤖",
    features: ["Model vs Model", "Sandbox", "No Rankings"],
  },
  {
    key: 'human',
    title: "Human vs Model",
    description: "Challenge AI models yourself and test your skills.",
    icon: "👤",
    features: ["You vs AI", "Real-time Feedback", "Personal Leaderboard"],
  },
  {
    key: 'arena',
    title: "Model Arena",
    description: "Watch AI models compete in a tournament setting.",
    icon: "🏆",
    features: ["Global Rankings", "Tournaments", "ELO System"],
  },
];

const availableModesMap: Record<string, string[]> = {
  tictactoe: ['playground', 'human'], // Added 'human' mode for Tic Tac Toe
  chess: [],
  'rock-paper-scissors': [],
  checkers: [],
  // Add more games and their available modes as needed
};

const GameModes = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const gameKey = (gameId || '').toLowerCase();
  const gameTitle =
    gameKey === 'tictactoe' ? 'Tic Tac Toe' :
    gameKey === 'chess' ? 'Chess' :
    gameKey === 'rock-paper-scissors' ? 'Rock Paper Scissors' :
    gameKey === 'checkers' ? 'Checkers' :
    gameKey;
  const gameImg = gameImages[gameKey] || '';

  const availableModes = availableModesMap[gameKey] || [];

  return (
    <div className="min-h-screen bg-cyber-dark bg-cyber-gradient relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-[length:50px_50px] opacity-20"></div>
      {/* Glowing Orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-cyber-glow rounded-full blur-3xl opacity-20 animate-cyber-float"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyber-accent-2 rounded-full blur-3xl opacity-20 animate-cyber-float" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center glass-effect-strong fixed top-0 left-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-1">
          <img src="/logo.png" alt="Model Arena Logo" className="h-12 w-12 align-middle" />
          <div className="text-2xl font-bold bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text font-pixel align-middle">
            Model Arena
          </div>
        </div>
        <nav className="flex gap-8 items-center">
          <Button onClick={() => navigate('/games')} className="glass-button font-pixel px-4 py-2">
            ← Back
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen bg-transparent text-white pt-24 pb-12">
        {/* Game Banner */}
        <div className="flex flex-col items-center mb-10">
          {gameImg && (
            <img src={gameImg} alt={gameTitle} className="h-32 w-auto rounded-xl shadow-xl border-4 border-[#00F2A9] mb-4 bg-cyber-primary/60 object-contain" />
          )}
          <h1 className="text-4xl font-pixel text-center bg-gradient-to-r from-[#FF3CBD] to-[#00F2A9] text-transparent bg-clip-text drop-shadow-lg mb-2">{gameTitle} Modes</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {modeData.map((mode) => {
            const available = availableModes.includes(mode.key);
            return (
              <div
                key={mode.key}
                className={`relative group rounded-2xl glass-effect-strong border-2 flex flex-col items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-cyber-glow hover:scale-100 z-20 cursor-pointer ${available ? 'border-[#00F2A9]' : 'border-[#FF3CBD] opacity-60'}`}
                style={{ minHeight: 340 }}
                onClick={available && gameKey === 'tictactoe' ? () => {
                  if (mode.key === 'playground') {
                    navigate('/games/tictactoe/playground');
                  } else if (mode.key === 'human') {
                    navigate('/games/tictactoe/human');
                  }
                } : undefined}
              >
                <div className="flex flex-col items-center w-full p-6">
                  <div className="text-5xl mb-4">{mode.icon}</div>
                  <h2 className="text-2xl font-pixel mb-2 text-center bg-gradient-to-r from-[#FF3CBD] to-[#00F2A9] text-transparent bg-clip-text">{mode.title}</h2>
                  <p className="text-cyber-light/80 text-center mb-4 font-mono">{mode.description}</p>
                  <ul className="mb-4 space-y-1">
                    {mode.features.map((f, i) => (
                      <li key={i} className="text-sm text-[#00F2A9] font-pixel flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#FF3CBD] rounded-full inline-block"></span> {f}
                      </li>
                    ))}
                  </ul>
                  {available ? (
                    <Button className="glass-button w-full font-pixel mt-auto py-3 text-lg bg-gradient-to-r from-[#00F2A9]/30 to-[#FF3CBD]/30 border-2 border-[#00F2A9] hover:from-[#00F2A9]/60 hover:to-[#FF3CBD]/60">
                      Enter
                    </Button>
                  ) : (
                    <Button className="glass-button w-full font-pixel mt-auto py-3 text-lg bg-gradient-to-r from-[#FF3CBD]/30 to-[#00F2A9]/30 border-2 border-[#FF3CBD] opacity-60 cursor-not-allowed" disabled>
                      Enter
                    </Button>
                  )}
                </div>
                {!available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark/80 backdrop-blur rounded-2xl z-10 transition-all duration-300 group-hover:bg-cyber-dark/90">
                    <span className="text-[#FF3CBD] font-pixel text-xl tracking-widest transition-all duration-300 group-hover:text-[#FF85E1]">
                      COMING SOON
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameModes; 