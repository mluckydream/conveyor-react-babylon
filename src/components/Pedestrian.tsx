import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import 'babylonjs-loaders';

const Pedestrian: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      if (idleAnim) idleAnim.play(true);

      const walkAnim = scene.animationGroups.find((a) => a.name === 'walk');
      if (walkAnim) walkAnim.play(true);

      const runAnim = scene.animationGroups.find((a) => a.name === 'run');
      if (runAnim) runAnim.play(true);

      // Additive animations
      const sadPoseAnimGroup = scene.animationGroups.find((a) => a.name === 'sad_pose');
      const sadPoseAnim = sadPoseAnimGroup
        ? BABYLON.AnimationGroup.MakeAnimationAdditive(sadPoseAnimGroup)
        : null;

      const sneakPoseAnimGroup = scene.animationGroups.find((a) => a.name === 'sneak_pose');
      const sneakPoseAnim = sneakPoseAnimGroup
        ? BABYLON.AnimationGroup.MakeAnimationAdditive(sneakPoseAnimGroup)
        : null;

      const headShakeAnimGroup = scene.animationGroups.find((a) => a.name === 'headShake');
      const headShakeAnim = headShakeAnimGroup
        ? BABYLON.AnimationGroup.MakeAnimationAdditive(headShakeAnimGroup)
        : null;

      const agreeAnimGroup = scene.animationGroups.find((a) => a.name === 'agree');
      const agreeAnim = agreeAnimGroup
        ? BABYLON.AnimationGroup.MakeAnimationAdditive(agreeAnimGroup)
        : null;

      [sadPoseAnim, sneakPoseAnim, headShakeAnim, agreeAnim].forEach((anim) => {
        if (anim) {
          anim.weight = 0;
          anim.play(true);
        }
      });

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
        if (idleAnim) idleAnim.play(true);
      });

      createButton('Walk', () => {
        if (walkAnim) walkAnim.play(true);
      });

      createButton('Run', () => {
        if (runAnim) runAnim.play(true);
      });

      engine.hideLoadingUI();
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

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block' }} />;
};

export default Pedestrian;