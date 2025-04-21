import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainScene from './components/MainScene';
import Conveyor from './components/Conveyor';
import PedestrianConfig from './components/PedestrianConfig';

export interface PedestrianConfigOption {
  state: 'static' | 'walk' | 'run';
  count: number;
}

export interface Config {
  numBoxes: number;
  boxSpeed: number;
  boxSpacing: number;
  pedestrian: PedestrianConfigOption;
}

interface ConfigContextValue {
  config: Config;
  // 修改 setConfig 的类型以支持 updater 函数
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export const ConfigContext = createContext<ConfigContextValue>({
  config: { numBoxes: 5, boxSpeed: 2, boxSpacing: 2.5, pedestrian: { state: 'static', count: 1 } },
  setConfig: () => {},
});

const App: React.FC = () => {
  const [config, setConfig] = useState<Config>({
    numBoxes: 5,
    boxSpeed: 2,
    boxSpacing: 2.5,
    pedestrian: { state: 'static', count: 1 },
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