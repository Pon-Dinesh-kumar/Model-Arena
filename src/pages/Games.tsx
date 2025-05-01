import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useRouteMusic } from '../presentation/hooks/useRouteMusic';

const gameData = [
  {
    title: "Tic Tac Toe",
    description: "Classic game of X's and O's with AI models.",
    image: "/games/tictactoe-3d.png",
    available: true,
    path: "/games/tictactoe"
  },
  {
    title: "Chess",
    description: "Strategic battle of wits between AI models.",
    image: "/games/chess.png",
    available: false,
    path: "/games/chess"
  },
  {
    title: "Rock Paper Scissors",
    description: "Test your model's quick decision making.",
    image: "/games/rps.png",
    available: false,
    path: "/games/rps"
  },
  {
    title: "Checkers",
    description: "Classic checkers with a modern AI twist.",
    image: "/games/checkers.png",
    available: false,
    path: "/games/checkers"
  }
];

const Games = () => {
  const navigate = useNavigate();
  useRouteMusic();

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
          <Button onClick={() => navigate('/')} className="glass-button font-pixel px-4 py-2">
            ← Back
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen bg-transparent text-white pt-24 pb-12">
        <h1 className="text-4xl font-pixel text-center mb-12 bg-gradient-to-r from-[#FF3CBD] to-[#00F2A9] text-transparent bg-clip-text drop-shadow-lg">Select a Game</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
          {gameData.map((game, idx) => (
            <div
              key={game.title}
              className={`relative group rounded-2xl glass-effect-strong border-2 ${game.available ? 'border-[#00F2A9]' : 'border-[#FF3CBD] opacity-60'} shadow-xl hover:shadow-cyber-glow transition-all duration-300 cursor-pointer flex flex-col items-center justify-between overflow-hidden`}
              onClick={() => game.available && navigate(game.path)}
              style={{ minHeight: 380 }}
            >
              <div className="w-full h-48 flex items-center justify-center bg-cyber-primary/60">
                <img src={game.image} alt={game.title} className={`object-contain h-40 transition-all duration-300 ${game.available ? '' : 'grayscale blur-[2px] opacity-70'}`} />
              </div>
              <div className="p-6 flex flex-col flex-1 w-full">
                <h2 className="text-2xl font-pixel mb-2 text-center bg-gradient-to-r from-[#FF3CBD] to-[#00F2A9] text-transparent bg-clip-text">{game.title}</h2>
                <p className="text-cyber-light/80 text-center mb-4 font-mono">{game.description}</p>
                {game.available ? (
                  <Button className="glass-button w-full font-pixel mt-auto py-3 text-lg bg-gradient-to-r from-[#00F2A9]/30 to-[#FF3CBD]/30 border-2 border-[#00F2A9] hover:from-[#00F2A9]/60 hover:to-[#FF3CBD]/60">
                    Play
                  </Button>
                ) : (
                  <Button className="glass-button w-full font-pixel mt-auto py-3 text-lg bg-gradient-to-r from-[#FF3CBD]/30 to-[#00F2A9]/30 border-2 border-[#FF3CBD] opacity-60 cursor-not-allowed" disabled>
                    Play
                  </Button>
                )}
                {!game.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark/80 backdrop-blur rounded-2xl z-10 transition-all duration-300 group-hover:bg-cyber-dark/90">
                    <span className="text-[#FF3CBD] font-pixel text-xl tracking-widest transition-all duration-300 group-hover:text-[#FF85E1] group-hover:scale-110">
                      COMING SOON
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games; 