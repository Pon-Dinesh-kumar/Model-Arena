import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Games from './pages/Games';
import GameModes from './pages/GameModes';
import Playground from './pages/games/tictactoe/Playground';
import HumanVsModel from './pages/games/tictactoe/HumanVsModel';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:gameId" element={<GameModes />} />
        <Route path="/games/tictactoe/playground" element={<Playground />} />
        <Route path="/games/tictactoe/human" element={<HumanVsModel />} />
      </Routes>
    </Router>
  );
};

export default App;
