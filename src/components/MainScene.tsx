import React, { useEffect, useRef, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { ConfigContext } from '../App';

const MainScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();
  const { config } = useContext(ConfigContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.style.pointerEvents = 'auto';
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    
    console.log('MainScene 当前配置：', config);
    
    // Camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera1',
      Math.PI / 2,
      Math.PI / 4,
      50,
      new BABYLON.Vector3(30, 10, 0),
      scene
    );
    camera.attachControl(canvas, true);
    
    // Lights
    const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    
    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;
    
    // 传送带
    const beltWidth = 6; 
    const conveyorBelt = BABYLON.MeshBuilder.CreateBox(
      'conveyorBelt',
      { width: beltWidth, height: 1, depth: 40 },
      scene
    );
    conveyorBelt.position = new BABYLON.Vector3(30, 0.5, 0);
    const conveyorMaterial = new BABYLON.StandardMaterial('conveyorMaterial', scene);
    conveyorMaterial.diffuseTexture = new BABYLON.Texture('/textures/conveyor.jpg', scene);
    conveyorBelt.material = conveyorMaterial;
    
    conveyorBelt.isPickable = true;
    conveyorBelt.actionManager = new BABYLON.ActionManager(scene);
    conveyorBelt.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        console.log("Conveyor clicked, navigating to /conveyor");
        navigate('/conveyor');
      })
    );
    
    // 创建运输纸箱
    const paperBoxes: BABYLON.Mesh[] = [];
    const numBoxes = config.numBoxes;
    const initialZ = -20;
    const spacing = config.boxSpacing;
    for (let i = 0; i < numBoxes; i++) {
      const box = BABYLON.MeshBuilder.CreateBox(`paperBox_${i}`, { size: 1 }, scene);
      box.position = new BABYLON.Vector3(30, 1, initialZ + i * spacing);
      const boxMat = new BABYLON.StandardMaterial(`boxMat_${i}`, scene);
      boxMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
      box.material = boxMat;
      paperBoxes.push(box);
    }
    
    // 加载动态行人（动画行人）
    let pedestrian: BABYLON.AbstractMesh | null = null;
    const rectCenter = new BABYLON.Vector3(30, 0, 0);
    const rectWidth = 40;
    const rectDepth = 50;
    const halfW = rectWidth / 2;
    const halfD = rectDepth / 2;
    const corners = [
      new BABYLON.Vector3(rectCenter.x + halfW, 0, rectCenter.z - halfD),
      new BABYLON.Vector3(rectCenter.x + halfW, 0, rectCenter.z + halfD),
      new BABYLON.Vector3(rectCenter.x - halfW, 0, rectCenter.z + halfD),
      new BABYLON.Vector3(rectCenter.x - halfW, 0, rectCenter.z - halfD),
    ];
    let currentSegment = 0;
    let progress = 0;
    const speed = 5;
    
    // BABYLON.SceneLoader.ImportMesh('', './scenes/', 'Xbot.glb', scene, (newMeshes) => {
    //   pedestrian = newMeshes[0];
    //   pedestrian.position = corners[0].clone();
    //   pedestrian.scaling = new BABYLON.Vector3(3, 3, 3);
    //   pedestrian.isPickable = true;
    //   pedestrian.getChildMeshes().forEach(child => child.isPickable = true);
    //   pedestrian.actionManager = new BABYLON.ActionManager(scene);
    //   pedestrian.actionManager.registerAction(
    //     new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, (evt) => {
    //       if (evt && evt.sourceEvent) evt.sourceEvent.stopPropagation();
    //       console.log("Pedestrian clicked, navigating to /pedestrian-config");
    //       navigate('/pedestrian-config');
    //     })
    //   );
    //   if (config.pedestrian.state === 'walk'){
    //     const walkAnim = scene.animationGroups.find(a => a.name === 'walk');
    //     walkAnim?.start(true);
    //   } else if (config.pedestrian.state === 'run'){
    //     const runAnim = scene.animationGroups.find(a => a.name === 'run');
    //     runAnim?.start(true);
    //   }
    //   // 模型加载完毕后关闭 Loading 状态
    //   setLoading(false);
    // });
    
    // 根据配置创建多个站立行人（预览/配置入口）
    for(let i = 0; i < config.pedestrian.count; i++){
      BABYLON.SceneLoader.ImportMesh('', './scenes/', 'Xbot.glb', scene, (meshes) => {
        const standingPed = meshes[0];
        standingPed.position = new BABYLON.Vector3(
          30 - beltWidth / 2 - 1,
          0,
          i * 5 - ((config.pedestrian.count - 1) * 5) / 2
        );
        standingPed.scaling = new BABYLON.Vector3(3, 3, 3);
        if (config.pedestrian.state === 'walk'){
          const walkAnim = scene.animationGroups.find(a => a.name === 'walk');
          walkAnim?.start(true);
        } else if (config.pedestrian.state === 'run'){
          const runAnim = scene.animationGroups.find(a => a.name === 'run');
          runAnim?.start(true);
        }
        standingPed.isPickable = true;
        standingPed.actionManager = new BABYLON.ActionManager(scene);
        standingPed.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
            console.log("Standing pedestrian clicked, navigating to /pedestrian-config");
            navigate('/pedestrian-config');
          })
        );
      });
    }
    
    // 更新纸箱运动
    scene.registerBeforeRender(() => {
      const delta = engine.getDeltaTime() * 0.001;
      paperBoxes.forEach(box => {
        box.position.z += delta * config.boxSpeed;
        if (box.position.z > 20) box.position.z = -20;
      });
      if (pedestrian) {
        const start = corners[currentSegment];
        const end = corners[(currentSegment + 1) % corners.length];
        const segmentDist = BABYLON.Vector3.Distance(start, end);
        progress += delta * speed;
        if (progress > segmentDist) {
          progress -= segmentDist;
          currentSegment = (currentSegment + 1) % corners.length;
        }
        const t = progress / segmentDist;
        BABYLON.Vector3.LerpToRef(start, end, t, pedestrian.position);
        const direction = end.subtract(start).normalize();
        pedestrian.rotation.y = Math.atan2(direction.z, direction.x);
      }
    });
    
    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
    
    return () => engine.dispose();
  }, [navigate, config]);
  
  return (
    <>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block' }} />
    </>
  );
};

export default MainScene;