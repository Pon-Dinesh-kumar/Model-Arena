import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Games from './pages/Games';
import GameModes from './pages/GameModes';
import Playground from './pages/games/tictactoe/Playground';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:gameId" element={<GameModes />} />
        <Route path="/games/tictactoe/playground" element={<Playground />} />
      </Routes>
    </Router>
  );
};

export default App;
