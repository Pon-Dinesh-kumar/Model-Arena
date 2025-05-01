import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface MusicContextType {
  isMuted: boolean;
  isMusicMuted: boolean;
  isAnimationMuted: boolean;
  currentTrack: string;
  isPlaying: boolean;
  toggleMute: () => void;
  toggleMusicMute: () => void;
  toggleAnimationMute: () => void;
  setTrack: (track: string) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
}

const defaultContext: MusicContextType = {
  isMuted: false,
  isMusicMuted: false,
  isAnimationMuted: false,
  currentTrack: 'track1',
  isPlaying: true,
  toggleMute: () => {},
  toggleMusicMute: () => {},
  toggleAnimationMute: () => {},
  setTrack: () => {},
  setMusicVolume: () => {},
  setSfxVolume: () => {},
};

const MusicContext = createContext<MusicContextType>(defaultContext);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isAnimationMuted, setIsAnimationMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('track1');
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.2);
  const [sfxVolume, setSfxVolume] = useState(0.4);

  // Handle user interaction for audio playback
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        if (audio && !isMuted && !isMusicMuted) {
          audio.play().catch(error => console.log('Audio play failed:', error));
        }
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audio, isMuted, isMusicMuted, hasUserInteracted]);

  // Initialize and update audio
  useEffect(() => {
    console.log('Initializing audio for track:', currentTrack);
    
    // Clean up previous audio
    if (audio) {
      audio.pause();
      audio.src = '';
    }

    const newAudio = new Audio(`/music/${currentTrack}.mp3`);
    newAudio.loop = true;
    newAudio.volume = musicVolume;
    setAudio(newAudio);

    // Try to play immediately
    if (!isMuted && !isMusicMuted) {
      newAudio.play().catch(error => console.log('Initial audio play failed:', error));
    }

    return () => {
      if (newAudio) {
        newAudio.pause();
        newAudio.src = '';
      }
    };
  }, [currentTrack, musicVolume]);

  // Handle mute state changes
  useEffect(() => {
    if (audio) {
      if (!isMuted && !isMusicMuted) {
        audio.play().catch(error => console.log('Audio play failed:', error));
      } else {
        audio.pause();
      }
    }
  }, [audio, isMuted, isMusicMuted]);

  const toggleMute = useCallback(() => {
    console.log('Toggling mute');
    setIsMuted(prev => !prev);
  }, []);

  const toggleMusicMute = useCallback(() => {
    console.log('Toggling music mute');
    setIsMusicMuted(prev => !prev);
  }, []);

  const toggleAnimationMute = useCallback(() => {
    console.log('Toggling animation mute');
    setIsAnimationMuted(prev => !prev);
  }, []);

  const setTrack = useCallback((track: string) => {
    console.log('Setting track:', track);
    setCurrentTrack(track);
  }, []);

  const setMusicVolumeHandler = useCallback((volume: number) => {
    setMusicVolume(volume);
    if (audio) {
      audio.volume = volume;
    }
  }, [audio]);

  const setSfxVolumeHandler = useCallback((volume: number) => {
    setSfxVolume(volume);
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
    }
  }, []);

  const value = {
    isMuted,
    isMusicMuted,
    isAnimationMuted,
    currentTrack,
    isPlaying: true,
    toggleMute,
    toggleMusicMute,
    toggleAnimationMute,
    setTrack,
    setMusicVolume: setMusicVolumeHandler,
    setSfxVolume: setSfxVolumeHandler,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}; 