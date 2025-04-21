import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainScene from './components/MainScene';
import Conveyor from './components/Conveyor';
import PedestrianConfig from './components/PedestrianConfig';

export interface Config {
  numBoxes: number;
  boxSpeed: number;
  boxSpacing: number;
}

interface ConfigContextValue {
  config: Config;
  setConfig: (config: Config) => void;
}

export const ConfigContext = createContext<ConfigContextValue>({
  config: { numBoxes: 5, boxSpeed: 2, boxSpacing: 2.5 },
  setConfig: () => {},
});

const App: React.FC = () => {
  const [config, setConfig] = useState<Config>({
    numBoxes: 5,
    boxSpeed: 2,
    boxSpacing: 2.5,
  });
  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      <Router>
        <Routes>
          <Route path="/" element={<MainScene />} />
          <Route path="/conveyor" element={<Conveyor />} />
          <Route path="/pedestrian-config" element={<PedestrianConfig />} />
        </Routes>
      </Router>
    </ConfigContext.Provider>
  );
};

export default App;