import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Animated text effect
  const [textIndex, setTextIndex] = useState(0);
  const taglines = [
    "Where AI Models Battle for Supremacy",
    "Test Your Models in Epic Showdowns",
    "Witness the Future of AI Competition",
    "Train, Battle, and Conquer"
  ];

  useEffect(() => {
    // Trigger initial animation
    setIsLoaded(true);
    
    // Start tagline rotation
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-dark bg-cyber-gradient relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-[length:50px_50px] opacity-20 animate-grid-flow"></div>
      
      {/* Enhanced Glowing Orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-cyber-glow rounded-full blur-3xl opacity-20 animate-cyber-float"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyber-accent-2 rounded-full blur-3xl opacity-20 animate-cyber-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyber-accent to-cyber-accent-2 rounded-full blur-3xl opacity-10 animate-pulse"></div>

      {/* Animated Particles with improved movement */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyber-accent rounded-full animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              opacity: 0.5 + Math.random() * 0.5
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className={`flex flex-col items-center justify-center min-h-[90vh] text-center transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          {/* Logo and Title with enhanced animation */}
          <div className="mb-12 relative transform transition-all duration-700 hover:scale-105">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent to-cyber-accent-2 mb-4 animate-cyber-pulse">
              Model Arena
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-cyber-accent to-cyber-accent-2 rounded-full transform transition-all duration-300 hover:w-48"></div>
          </div>

          {/* Animated Tagline with smooth transition */}
          <div className="h-12 mb-12 relative">
            <p className="text-cyber-accent text-xl md:text-2xl font-medium transition-all duration-500 transform hover:scale-105">
              {taglines[textIndex]}
            </p>
          </div>

          {/* Enhanced Main CTA Button */}
          <Button
            onClick={() => navigate('/games')}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`px-12 py-8 text-2xl font-bold bg-gradient-to-r from-cyber-accent to-cyber-accent-2 text-cyber-dark transform transition-all duration-300 shadow-cyber hover:shadow-cyber-glow ${
              isHovered ? 'scale-105' : ''
            }`}
          >
            Enter the Arena
          </Button>

          {/* Feature Cards with improved animations */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
            <div className="bg-cyber-primary/40 backdrop-blur-md rounded-lg p-8 border border-cyber-accent/30 shadow-cyber hover:shadow-cyber-glow transition-all duration-300 group transform hover:-translate-y-2">
              <div className="text-4xl mb-4 text-cyber-accent group-hover:scale-110 transition-transform duration-300">🤖</div>
              <h3 className="text-cyber-accent text-xl font-bold mb-3">Model Playground</h3>
              <p className="text-cyber-light/80">Test your AI models in a controlled environment. Watch them learn, adapt, and compete against each other.</p>
            </div>
            <div className="bg-cyber-primary/40 backdrop-blur-md rounded-lg p-8 border border-cyber-accent-2/30 shadow-cyber hover:shadow-cyber-glow transition-all duration-300 group transform hover:-translate-y-2">
              <div className="text-4xl mb-4 text-cyber-accent-2 group-hover:scale-110 transition-transform duration-300">👤</div>
              <h3 className="text-cyber-accent-2 text-xl font-bold mb-3">Human vs AI</h3>
              <p className="text-cyber-light/80">Challenge AI models yourself. Test your skills against the most advanced algorithms.</p>
            </div>
            <div className="bg-cyber-primary/40 backdrop-blur-md rounded-lg p-8 border border-cyber-accent/30 shadow-cyber hover:shadow-cyber-glow transition-all duration-300 group transform hover:-translate-y-2">
              <div className="text-4xl mb-4 text-cyber-accent group-hover:scale-110 transition-transform duration-300">🏆</div>
              <h3 className="text-cyber-accent text-xl font-bold mb-3">Model Arena</h3>
              <p className="text-cyber-light/80">Watch AI models compete in epic tournaments. Witness the evolution of artificial intelligence.</p>
            </div>
          </div>

          {/* Additional Features with improved styling */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="bg-cyber-primary/30 backdrop-blur-sm rounded-lg p-6 border border-cyber-accent/20 transform transition-all duration-300 hover:scale-105">
              <h4 className="text-cyber-accent text-lg font-bold mb-2">Multiple Game Types</h4>
              <p className="text-cyber-light/70">From classic games to complex challenges, test your models in various scenarios.</p>
            </div>
            <div className="bg-cyber-primary/30 backdrop-blur-sm rounded-lg p-6 border border-cyber-accent-2/20 transform transition-all duration-300 hover:scale-105">
              <h4 className="text-cyber-accent-2 text-lg font-bold mb-2">Real-time Analytics</h4>
              <p className="text-cyber-light/70">Track performance, analyze strategies, and improve your models with detailed insights.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing; 