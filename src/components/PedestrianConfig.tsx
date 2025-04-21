import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { ConfigContext, Config } from '../App';

type PedestrianState = 'static' | 'walk' | 'run';

interface PedestrianConfigSettings {
  count: number;
  state: PedestrianState;
}

const PedestrianConfig: React.FC = () => {
  const navigate = useNavigate();
  const { config, setConfig } = useContext(ConfigContext);
  // 用本地状态保存预览配置
  const [settings, setSettings] = useState<PedestrianConfigSettings>({
    count: config.pedestrian.count,
    state: config.pedestrian.state
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // 设置相机：更远更宽的视野
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI/2,
      Math.PI/3,
      16,
      new BABYLON.Vector3(0,1,0),
      scene
    );
    camera.attachControl(canvas, true);
    
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0,1,0), scene);
    light.intensity = 0.8;

    // 导入行人模型预览
    BABYLON.SceneLoader.ImportMesh("", "./scenes/", "Xbot.glb", scene, (meshes) => {
      const ped = meshes[0];
      ped.scaling = new BABYLON.Vector3(3,3,3);
      ped.position = new BABYLON.Vector3(0,0,0);     
      
      if(settings.state === 'walk'){
        const walkAnim = scene.animationGroups.find(a => a.name === 'walk');
        walkAnim?.start(true);
      } else if(settings.state === 'run'){
        const runAnim = scene.animationGroups.find(a => a.name === 'run');
        runAnim?.start(true);
      }
    });

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
    
    return () => engine.dispose();
  }, [settings.state]);

  // 返回时更新全局行人配置
  const handleReturn = () => {
    setConfig((prev: Config) => ({
      ...prev,
      pedestrian: { state: settings.state, count: settings.count }
    }));
    navigate('/');
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100vh', display: 'block' }} 
      />
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#000',
        padding: '10px',
        color: '#0ff',
        fontFamily: 'Consolas, monospace'
      }}>
        <h3>人员配置</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>
            数量:
            <input
              type="number"
              value={settings.count}
              onChange={(e) => setSettings({ ...settings, count: parseInt(e.target.value) || 1 })}
              style={{ marginLeft: '8px', width: '60px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            状态:
            <select
              value={settings.state}
              onChange={(e) => setSettings({ ...settings, state: e.target.value as PedestrianState })}
              style={{ marginLeft: '8px' }}
            >
              <option value="static">静止</option>
              <option value="walk">行走</option>
              <option value="run">跑步</option>
            </select>
          </label>
        </div>
        <button
          onClick={handleReturn}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            backgroundColor: '#0ff',
            border: 'none',
            color: '#000',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          返回主场景
        </button>
      </div>
    </div>
  );
};

export default PedestrianConfig;