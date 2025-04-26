import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  available: boolean;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, icon, available, onClick }) => {
  return (
    <div className="relative group">
      <div 
        className={`bg-cyber-primary/80 backdrop-blur-sm rounded-lg p-6 border border-cyber-accent/30 shadow-cyber hover:shadow-cyber-glow transition-all duration-300 cursor-pointer ${
          !available && 'opacity-50'
        }`}
        onClick={available ? onClick : undefined}
      >
        <div className="text-4xl mb-4 text-cyber-accent">{icon}</div>
        <h3 className="text-cyber-accent text-xl font-bold mb-3">{title}</h3>
        <p className="text-cyber-light/80">{description}</p>
      </div>
      {!available && (
        <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark/80 backdrop-blur-sm rounded-lg">
          <span className="text-cyber-accent font-bold text-lg">Coming Soon</span>
        </div>
      )}
    </div>
  );
};

const Games = () => {
  const navigate = useNavigate();

  const games = [
    {
      title: "Tic Tac Toe",
      description: "Classic game of X's and O's with AI models",
      icon: "⭕",
      available: true,
      path: "/games/tictactoe"
    },
    {
      title: "Chess",
      description: "Strategic battle of wits between AI models",
      icon: "♟️",
      available: false,
      path: "/games/chess"
    },
    {
      title: "Image Detection",
      description: "Test your model's visual recognition capabilities",
      icon: "🖼️",
      available: false,
      path: "/games/image-detection"
    },
    {
      title: "Natural Language",
      description: "Challenge models in text-based games",
      icon: "💬",
      available: false,
      path: "/games/nlp"
    }
  ];

  return (
    <div className="min-h-screen bg-cyber-dark bg-cyber-gradient relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-[length:50px_50px] opacity-20"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-cyber-glow rounded-full blur-3xl opacity-20 animate-cyber-float"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyber-accent-2 rounded-full blur-3xl opacity-20 animate-cyber-float" style={{ animationDelay: '1s' }}></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <Button
            onClick={() => navigate('/')}
            className="bg-cyber-secondary hover:bg-cyber-secondary/80 text-cyber-light"
          >
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-cyber-light">Select Game</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game, index) => (
            <GameCard
              key={index}
              title={game.title}
              description={game.description}
              icon={game.icon}
              available={game.available}
              onClick={() => navigate(game.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games; 