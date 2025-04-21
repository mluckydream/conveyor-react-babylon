import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

const PedestrianConfig: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [params, setParams] = useState([
    { name: 'Head Shake', anim: null as BABYLON.AnimationGroup | null, weight: 0 },
    { name: 'Agree', anim: null as BABYLON.AnimationGroup | null, weight: 0 },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // Camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera1',
      Math.PI / 2,
      Math.PI / 4,
      3,
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    camera.attachControl(canvas, true);

    // Lights
    const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.6;

    // Load Pedestrian
    BABYLON.SceneLoader.ImportMesh('', './scenes/', 'Xbot.glb', scene, (newMeshes) => {
      const pedestrian = newMeshes[0];
      pedestrian.position = new BABYLON.Vector3(0, 0, 0);
      pedestrian.scaling = new BABYLON.Vector3(2, 2, 2);

      // Initialize animations
      const headShakeAnimGroup = scene.animationGroups.find((a) => a.name === 'headShake');
      const agreeAnimGroup = scene.animationGroups.find((a) => a.name === 'agree');

      const updatedParams = [
        { name: 'Head Shake', anim: headShakeAnimGroup ?? null, weight: 0 },
        { name: 'Agree', anim: agreeAnimGroup ?? null, weight: 0 },
      ];

      setParams(updatedParams);

      updatedParams.forEach((param) => {
        if (param.anim) {
          param.anim.weight = 0;
          param.anim.play(true);
        }
      });
    });

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize event
    window.addEventListener('resize', () => {
      engine.resize();
    });

    return () => {
      engine.dispose();
    };
  }, []);

  const handleSliderChange = (index: number, value: number) => {
    const newParams = [...params];
    newParams[index].weight = value;
    setParams(newParams);

    // Update animation weights
    newParams[index].anim?.animatables.forEach((animatable) => {
      animatable.weight = value;
    });
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block' }} />
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        {params.map((param, index) => (
          <div key={param.name} style={{ marginBottom: '10px' }}>
            <label>
              {param.name} Weight:
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={param.weight}
                onChange={(e) => handleSliderChange(index, parseFloat(e.target.value))}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PedestrianConfig;
