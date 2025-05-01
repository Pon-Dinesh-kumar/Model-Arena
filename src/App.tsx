import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Games from './pages/Games';
import GameModes from './pages/GameModes';
import Playground from './pages/games/tictactoe/Playground';
import HumanVsModel from './pages/games/tictactoe/HumanVsModel';
import About from './pages/About';
import { MusicProvider } from './presentation/context/MusicContext';
import MusicPlayer from './presentation/components/MusicPlayer/MusicPlayer';

const App = () => {
  return (
    <MusicProvider>
      <div className="App relative min-h-screen w-full">
        <div className="fixed inset-0 z-[99998] pointer-events-none" id="music-player-container">
          <MusicPlayer />
        </div>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:gameId" element={<GameModes />} />
            <Route path="/games/tictactoe/playground" element={<Playground />} />
            <Route path="/games/tictactoe/human" element={<HumanVsModel />} />
          </Routes>
        </Router>
      </div>
    </MusicProvider>
  );
};

export default App;
