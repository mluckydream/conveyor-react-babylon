import React, { useEffect, useRef, useContext } from 'react';
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
    
    // 示例：在控制台打印当前箱子配置参数
    console.log('MainScene 当前箱子配置：', config);
    
    // （后续 3D 场景代码保持不变）
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
    const conveyorBelt = BABYLON.MeshBuilder.CreateBox(
      'conveyorBelt',
      { width: 10, height: 1, depth: 40 },
      scene
    );
    conveyorBelt.position = new BABYLON.Vector3(30, 0.5, 0);
    const conveyorMaterial = new BABYLON.StandardMaterial('conveyorMaterial', scene);
    conveyorMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.3);
    conveyorBelt.material = conveyorMaterial;
    
    conveyorBelt.isPickable = true;
    conveyorBelt.actionManager = new BABYLON.ActionManager(scene);
    conveyorBelt.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        console.log("Conveyor clicked, navigating to /conveyor");
        navigate('/conveyor');
      })
    );
    
    // 创建运输纸箱（在传送带上）
    const paperBoxes: BABYLON.Mesh[] = [];
    const numBoxes = config.numBoxes; // 动态使用配置的箱子数量
    const initialZ = -20;             // 初始 Z 坐标（可根据需要调整）
    const spacing = config.boxSpacing;  // 使用配置的箱子间距
    for (let i = 0; i < numBoxes; i++) {
      const box = BABYLON.MeshBuilder.CreateBox(`paperBox_${i}`, { size: 1 }, scene);
      // 纸箱均匀分布在传送带中心 x=30 上，沿 z 轴
      box.position = new BABYLON.Vector3(30, 1, initialZ + i * spacing);
      const boxMat = new BABYLON.StandardMaterial(`boxMat_${i}`, scene);
      boxMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
      box.material = boxMat;
      paperBoxes.push(box);
    }
    
    // 行人及运动（略，保持原有代码逻辑）
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
    
    BABYLON.SceneLoader.ImportMesh('', './scenes/', 'Xbot.glb', scene, (newMeshes) => {
      pedestrian = newMeshes[0];
      pedestrian.position = corners[0].clone();
      pedestrian.scaling = new BABYLON.Vector3(3, 3, 3);
      pedestrian.isPickable = true;
      pedestrian.getChildMeshes().forEach((child) => {
        child.isPickable = true;
      });
      pedestrian.actionManager = new BABYLON.ActionManager(scene);
      pedestrian.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, (evt) => {
          if (evt && evt.sourceEvent) {
            evt.sourceEvent.stopPropagation();
          }
          console.log("Pedestrian clicked, navigating to /pedestrian-config");
          navigate('/pedestrian-config');
        })
      );
      const walkAnim = scene.animationGroups.find((a) => a.name === 'walk');
      walkAnim?.start(true);
    });
    
    scene.registerBeforeRender(() => {
      const delta = engine.getDeltaTime() * 0.001;
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
        const targetAngle = Math.atan2(direction.z, direction.x);
        pedestrian.rotation.y = targetAngle;
      }
      
      paperBoxes.forEach((box) => {
        box.position.z += delta * 3;
        if (box.position.z > 20) {
          box.position.z = -20;
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
  }, [navigate, config]);
  
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block' }} />;
};

export default MainScene;