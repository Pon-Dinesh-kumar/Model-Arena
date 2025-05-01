import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMusic } from '../context/MusicContext';

export const useRouteMusic = () => {
  const location = useLocation();
  const { setTrack } = useMusic();

  useEffect(() => {
    const path = location.pathname;
    let defaultTrack = 'track3'; // Default for landing page

    if (path === '/games') {
      defaultTrack = 'track1';
    } else if (path.includes('/games/') && !path.includes('/tictactoe/')) {
      defaultTrack = 'track2';
    } else if (path.includes('/tictactoe')) {
      defaultTrack = 'track4';
    }

    console.log('Route changed to:', path, 'Setting track to:', defaultTrack);
    setTrack(defaultTrack);
  }, [location.pathname, setTrack]);
}; 