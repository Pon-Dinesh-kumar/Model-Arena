import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";

interface ModeCardProps {
  title: string;
  description: string;
  icon: string;
  available: boolean;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, description, icon, available, onClick }) => {
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

const GameModes = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();

  // Get game title based on gameId
  const getGameTitle = (id: string) => {
    const titles: { [key: string]: string } = {
      'tictactoe': 'Tic Tac Toe',
      'chess': 'Chess',
      'image-detection': 'Image Detection',
      'nlp': 'Natural Language'
    };
    return titles[id] || id;
  };

  // Get available modes based on gameId
  const getAvailableModes = (id: string) => {
    const modes = [
      {
        title: "Model Playground",
        description: "Test your AI models against each other in a controlled environment",
        icon: "🤖",
        available: id === 'tictactoe',
        path: `/games/${id}/playground`
      },
      {
        title: "Human vs Model",
        description: "Challenge AI models yourself and test your skills",
        icon: "👤",
        available: false,
        path: `/games/${id}/human`
      },
      {
        title: "Model Arena",
        description: "Watch AI models compete in a tournament setting",
        icon: "🏆",
        available: false,
        path: `/games/${id}/arena`
      }
    ];
    return modes;
  };

  const gameTitle = getGameTitle(gameId || '');
  const modes = getAvailableModes(gameId || '');

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
            onClick={() => navigate('/games')}
            className="bg-cyber-secondary hover:bg-cyber-secondary/80 text-cyber-light"
          >
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-cyber-light">{gameTitle} Modes</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode, index) => (
            <ModeCard
              key={index}
              title={mode.title}
              description={mode.description}
              icon={mode.icon}
              available={mode.available}
              onClick={() => navigate(mode.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameModes; 