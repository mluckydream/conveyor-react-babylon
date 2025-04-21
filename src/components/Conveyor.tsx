import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { ConfigContext } from '../App';

interface ConveyorProps {
  numBoxes?: number;
  boxSpeed?: number;
  boxSpacing?: number;
}

const Conveyor: React.FC<ConveyorProps> = ({
  numBoxes = 5,
  boxSpeed = 2,
  boxSpacing = 2.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { setConfig } = useContext(ConfigContext);
  const [currentNumBoxes, setCurrentNumBoxes] = useState<number>(numBoxes);
  const [currentBoxSpeed, setCurrentBoxSpeed] = useState<number>(boxSpeed);
  const [currentBoxSpacing, setCurrentBoxSpacing] = useState<number>(boxSpacing);
  const navigate = useNavigate();

  // 参数变化时同步更新 Context
  useEffect(() => {
    setConfig({
      numBoxes: currentNumBoxes,
      boxSpeed: currentBoxSpeed,
      boxSpacing: currentBoxSpacing,
      pedestrian: { state: 'static', count: 1 },
    });
  }, [currentNumBoxes, currentBoxSpeed, currentBoxSpacing, setConfig]);

  // 重建场景（动画逻辑保持不变）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    
    const camera = new BABYLON.ArcRotateCamera(
      'camera1',
      Math.PI / 2,
      Math.PI / 4,
      12,
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 20;
    camera.wheelDeltaPercentage = 0.01;

    const hemiLight = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemiLight.intensity = 0.6;
    hemiLight.specular = BABYLON.Color3.Black();

    const dirLight = new BABYLON.DirectionalLight(
      'dir01',
      new BABYLON.Vector3(0, -0.5, -1.0),
      scene
    );
    dirLight.position = new BABYLON.Vector3(0, 5, 5);

    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // 创建箱子
    const boxes: BABYLON.Mesh[] = [];
    for (let i = 0; i < currentNumBoxes; i++) {
      const box = BABYLON.MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
      box.position = new BABYLON.Vector3(
        -((currentNumBoxes - 1) * currentBoxSpacing) / 2 + i * currentBoxSpacing,
        1,
        0
      );
      const mat = new BABYLON.StandardMaterial(`boxMat_${i}`, scene);
      mat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
      box.material = mat;
      boxes.push(box);
    }

    // 箱子动画：循环运动
    scene.registerBeforeRender(() => {
      const delta = engine.getDeltaTime() * 0.001;
      boxes.forEach((box) => {
        box.position.x += currentBoxSpeed * delta;
        if (box.position.x > (currentNumBoxes / 2) * currentBoxSpacing) {
          box.position.x = -((currentNumBoxes / 2) * currentBoxSpacing);
        }
      });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });
    
    window.addEventListener('resize', () => {
      engine.resize();
    });
    
    return () => {
      engine.dispose();
    };
  }, [currentNumBoxes, currentBoxSpeed, currentBoxSpacing]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Babylon.js画布区域 */}
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: 'calc(100% - 80px)', display: 'block' }} 
      />
      {/* 配置区域 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(90deg, #1565c0, #0277bd, #00838f)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.8)',
          color: '#0ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Consolas, monospace',
          fontSize: '16px',
        }}
      >
        <div style={{ margin: '0 20px' }}>
          <label>
            箱子数量:
            <input
              type="number"
              value={currentNumBoxes}
              onChange={(e) =>
                setCurrentNumBoxes(parseInt(e.target.value) || 1)
              }
              style={{
                marginLeft: '8px',
                width: '70px',
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#0ff',
              }}
            />
          </label>
        </div>
        <div style={{ margin: '0 20px' }}>
          <label>
            箱子速度:
            <input
              type="number"
              value={currentBoxSpeed}
              onChange={(e) =>
                setCurrentBoxSpeed(parseFloat(e.target.value) || 0)
              }
              style={{
                marginLeft: '8px',
                width: '70px',
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#0ff',
              }}
            />
          </label>
        </div>
        <div style={{ margin: '0 20px' }}>
          <label>
            箱子间距:
            <input
              type="number"
              value={currentBoxSpacing}
              onChange={(e) =>
                setCurrentBoxSpacing(parseFloat(e.target.value) || 0)
              }
              style={{
                marginLeft: '8px',
                width: '70px',
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#0ff',
              }}
            />
          </label>
        </div>
        {/* 返回主场景按钮 */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginLeft: '20px',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#0ff',
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

export default Conveyor;