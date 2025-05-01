import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { FaMusic, FaVolumeMute, FaVolumeUp, FaRandom, FaPlay, FaPause } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MusicPlayer: React.FC = () => {
  const {
    isMuted,
    isMusicMuted,
    isAnimationMuted,
    currentTrack,
    toggleMute,
    toggleMusicMute,
    toggleAnimationMute,
    setTrack,
    setMusicVolume: setContextMusicVolume,
    setSfxVolume: setContextSfxVolume
  } = useMusic();

  console.log('MusicPlayer rendered with context:', {
    isMuted,
    isMusicMuted,
    isAnimationMuted,
    currentTrack,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ 
    x: -12.5,
    y: window.innerHeight / 2 - 25 
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom');
  const [musicVolume, setMusicVolume] = useState(20);
  const [sfxVolume, setSfxVolume] = useState(40);
  const [selectedTrack, setSelectedTrack] = useState(currentTrack);
  const [tracks] = useState([
    { id: 'track1', name: 'Neon Dreams (Landing Page)' },
    { id: 'track2', name: 'Cyber Pulse (Games Page)' },
    { id: 'track3', name: 'Digital Rain (Game Mode)' },
    { id: 'track4', name: 'Retro Arcade (Tic Tac Toe)' },
  ]);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    console.log('MusicPlayer mounted');
    console.log('Window dimensions:', {
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    const savedPosition = localStorage.getItem('musicPlayerPosition');
    console.log('Saved position from localStorage:', savedPosition);
    
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        // Ensure the saved position maintains 1/4 outside if at edge
        if (Math.abs(parsedPosition.x) < 5) {
          parsedPosition.x = -12.5;
        } else if (Math.abs(parsedPosition.x - (window.innerWidth - 50)) < 5) {
          parsedPosition.x = window.innerWidth - 37.5;
        }
        setPosition(parsedPosition);
        console.log('Setting position from localStorage:', parsedPosition);
      } catch (error) {
        console.error('Error parsing saved position:', error);
      }
    }

    const handleResize = () => {
      console.log('Window resized:', {
        oldWidth: windowSize.width,
        oldHeight: windowSize.height,
        newWidth: window.innerWidth,
        newHeight: window.innerHeight
      });
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowSize]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        menuRef.current && 
        containerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    setIsOpen(false);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'music-player');
  };

  const handleDrag = (e: React.DragEvent) => {
    if (!isDragging) return;
    
    const elementWidth = 50;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate new position based on drag
    const newX = e.clientX - elementWidth / 2;
    const newY = e.clientY - elementWidth / 2;
    
    // Keep within bounds
    const boundedX = Math.max(-elementWidth * 0.25, Math.min(newX, viewportWidth - elementWidth * 0.75));
    const boundedY = Math.max(0, Math.min(newY, viewportHeight - elementWidth));
    
    setPosition({ x: boundedX, y: boundedY });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    const elementWidth = 50;
    const viewportWidth = window.innerWidth;
    
    // Get the final position
    const newX = e.clientX - elementWidth / 2;
    const newY = e.clientY - elementWidth / 2;
    
    // Snap to closest edge
    const distanceToLeft = Math.abs(newX);
    const distanceToRight = Math.abs(viewportWidth - (newX + elementWidth));
    
    const finalX = distanceToLeft < distanceToRight 
      ? -elementWidth * 0.25 
      : viewportWidth - elementWidth * 0.75;
    
    const finalY = Math.max(0, Math.min(newY, window.innerHeight - elementWidth));
    
    const newPosition = { x: finalX, y: finalY };
    setPosition(newPosition);
    localStorage.setItem('musicPlayerPosition', JSON.stringify(newPosition));
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const elementWidth = 50;
    const leftEdge = -elementWidth * 0.25;
    const rightEdge = window.innerWidth - elementWidth * 0.75;
    
    const isAtLeftEdge = Math.abs(position.x - leftEdge) < 5;
    const isAtRightEdge = Math.abs(position.x - rightEdge) < 5;
    
    if (isAtLeftEdge || isAtRightEdge) {
      // Determine if menu should open above or below based on icon position
      const iconCenterY = position.y + elementWidth / 2;
      const viewportCenterY = window.innerHeight / 2;
      setMenuPosition(iconCenterY > viewportCenterY ? 'top' : 'bottom');
      setIsOpen(!isOpen);
    }
  };

  // Add volume control handlers
  const handleMusicVolumeChange = (level: number) => {
    const newVolume = level * 20;
    setMusicVolume(newVolume);
    setContextMusicVolume(newVolume / 100); // Convert to 0-1 scale
  };

  const handleSfxVolumeChange = (level: number) => {
    const newVolume = level * 20;
    setSfxVolume(newVolume);
    setContextSfxVolume(newVolume / 100); // Convert to 0-1 scale
  };

  // Update selected track when currentTrack changes
  useEffect(() => {
    setSelectedTrack(currentTrack);
  }, [currentTrack]);

  const VolumeLevel = ({ volume, onChange }: { volume: number, onChange: (level: number) => void }) => {
    const levels = [1, 2, 3, 4, 5];
    const currentLevel = Math.ceil(volume / 20);

    return (
      <div className="flex items-center space-x-1">
        {levels.map((level) => (
          <button
            key={level}
            onClick={(e) => {
              e.stopPropagation();
              onChange(level);
            }}
            className={`w-6 h-6 rounded-sm transition-all duration-200 ${
              level <= currentLevel
                ? 'bg-green-500 hover:bg-green-400'
                : 'bg-green-900/50 hover:bg-green-800/50'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-[99999] select-none cursor-move"
      style={{
        left: position.x,
        top: position.y,
        width: '50px',
        height: '50px',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <div 
        className={`relative w-full h-full rounded-full transition-all duration-300 ${
          isDragging 
            ? 'bg-gradient-to-r from-pink-500 to-emerald-500 scale-110' 
            : (position.x < 0 || position.x > window.innerWidth - 50)
              ? 'bg-gradient-to-r from-pink-500/50 to-emerald-500/50 hover:from-pink-500 hover:to-emerald-500'
              : 'bg-gradient-to-r from-pink-500 to-emerald-500'
        } text-white shadow-lg hover:shadow-xl backdrop-blur-sm`}
      >
        <FaMusic 
          size={24} 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
            (position.x < 0 || position.x > window.innerWidth - 50) ? 'opacity-50 hover:opacity-100' : ''
          }`} 
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.8, y: menuPosition === 'bottom' ? 20 : -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: menuPosition === 'bottom' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${
              position.x < 0 ? 'left-full' : 'right-full'
            } ${menuPosition === 'bottom' ? 'mt-2' : 'mb-2'} ${
              menuPosition === 'top' ? 'bottom-full' : 'top-full'
            } w-80 backdrop-blur-md bg-pink-900/20 rounded-lg shadow-2xl p-4 border border-pink-500/30`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div 
              className="space-y-4" 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-pink-400 font-bold text-lg">Audio Controls</span>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="p-2 rounded-full bg-pink-900/50 hover:bg-pink-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                </motion.button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-pink-400 font-bold">Music Volume</span>
                  <span className="text-pink-300 font-mono">{musicVolume}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <motion.button
                      key={level}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMusicVolumeChange(level);
                      }}
                      className={`w-8 h-8 rounded-sm transition-all duration-200 ${
                        level <= Math.ceil(musicVolume / 20)
                          ? 'bg-gradient-to-r from-pink-500 to-emerald-500 hover:from-pink-400 hover:to-emerald-400'
                          : 'bg-pink-900/50 hover:bg-pink-800/50'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-pink-400 font-bold">SFX Volume</span>
                  <span className="text-pink-300 font-mono">{sfxVolume}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <motion.button
                      key={level}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSfxVolumeChange(level);
                      }}
                      className={`w-8 h-8 rounded-sm transition-all duration-200 ${
                        level <= Math.ceil(sfxVolume / 20)
                          ? 'bg-gradient-to-r from-pink-500 to-emerald-500 hover:from-pink-400 hover:to-emerald-400'
                          : 'bg-pink-900/50 hover:bg-pink-800/50'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-pink-400 font-bold block">Select Track:</span>
                <motion.select
                  value={selectedTrack}
                  className="w-full p-2 rounded bg-pink-900/50 text-white border border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  onChange={(e) => {
                    e.stopPropagation();
                    setSelectedTrack(e.target.value);
                    setTrack(e.target.value);
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id} className="bg-pink-900">
                      {track.name}
                    </option>
                  ))}
                </motion.select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MusicPlayer; 