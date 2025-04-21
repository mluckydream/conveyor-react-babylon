import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import 'babylonjs-loaders';

const Pedestrian: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [params, setParams] = useState([
    { name: 'Head Shake', anim: null as BABYLON.AnimationGroup | null, weight: 0, key: '3' },
    { name: 'Agree', anim: null as BABYLON.AnimationGroup | null, weight: 0, key: '4' },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true);
    engine.enableOfflineSupport = false;
    engine.displayLoadingUI();

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
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 10;
    camera.wheelDeltaPercentage = 0.01;

    // Lights
    const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.6;
    light.specular = BABYLON.Color3.Black();

    const light2 = new BABYLON.DirectionalLight('dir01', new BABYLON.Vector3(0, -0.5, -1.0), scene);
    light2.position = new BABYLON.Vector3(0, 5, 5);

    // Shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // Load Model
    BABYLON.SceneLoader.ImportMesh('', './scenes/', 'Xbot.glb', scene, (newMeshes) => {
      shadowGenerator.addShadowCaster(newMeshes[0], true);
      newMeshes.forEach((mesh) => {
        mesh.receiveShadows = false;
      });

      const helper = scene.createDefaultEnvironment({
        enableGroundShadow: true,
      });

      if (helper) {
        helper.setMainColor(BABYLON.Color3.Gray());
        if (helper.ground) {
          helper.ground.position.y += 0.01;
        }
      }

      // Initialize animations
      const idleAnim = scene.animationGroups.find((a) => a.name === 'idle');
      const walkAnim = scene.animationGroups.find((a) => a.name === 'walk');
      const runAnim = scene.animationGroups.find((a) => a.name === 'run');

      const headShakeAnimGroup = scene.animationGroups.find((a) => a.name === 'headShake');
      const headShakeAnim = headShakeAnimGroup
        ? BABYLON.AnimationGroup.MakeAnimationAdditive(headShakeAnimGroup)
        : null;

      const agreeAnimGroup = scene.animationGroups.find((a) => a.name === 'agree');
      const agreeAnim = agreeAnimGroup
        ? BABYLON.AnimationGroup.MakeAnimationAdditive(agreeAnimGroup)
        : null;

      const updatedParams = [
        { name: 'Head Shake', anim: headShakeAnim, weight: 0, key: '3' },
        { name: 'Agree', anim: agreeAnim, weight: 0, key: '4' },
      ];

      setParams(updatedParams);

      updatedParams.forEach((param) => {
        if (param.anim) {
          param.anim.weight = 0;
          param.anim.play(true);
        }
      });

      // Ensure animations and poses are updated together
      const updateAnimations = () => {
        updatedParams.forEach((param) => {
          if (param.anim) {
            param.anim.animatables.forEach((animatable) => {
              animatable.weight = param.weight;
            });
          }
        });
      };

      // Handle keyboard input
      const handleKeyDown = (event: KeyboardEvent) => {
        const param = updatedParams.find((p) => p.key === event.key);
        if (param && param.anim) {
          param.weight = 1; // Set weight to maximum when key is pressed
          updateAnimations();
        }
      };

      const handleKeyUp = (event: KeyboardEvent) => {
        const param = updatedParams.find((p) => p.key === event.key);
        if (param && param.anim) {
          param.weight = 0; // Reset weight when key is released
          updateAnimations();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      // UI
      const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
      const UiPanel = new GUI.StackPanel();
      UiPanel.width = '220px';
      UiPanel.fontSize = '14px';
      UiPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      UiPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      advancedTexture.addControl(UiPanel);

      const createButton = (text: string, onClick: () => void) => {
        const button = GUI.Button.CreateSimpleButton(`button-${text}`, text);
        button.paddingTop = '10px';
        button.width = '100px';
        button.height = '50px';
        button.color = 'white';
        button.background = 'green';
        button.onPointerDownObservable.add(onClick);
        UiPanel.addControl(button);
      };

      createButton('Idle', () => {
        if (idleAnim) {
          idleAnim.start(true);
          walkAnim?.stop();
          runAnim?.stop();
        }
      });

      createButton('Walk', () => {
        if (walkAnim) {
          walkAnim.start(true);
          idleAnim?.stop();
          runAnim?.stop();
        }
      });

      createButton('Run', () => {
        if (runAnim) {
          runAnim.start(true);
          idleAnim?.stop();
          walkAnim?.stop();
        }
      });

      engine.hideLoadingUI();

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        engine.dispose();
      };
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

export default Pedestrian;