import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Object3DData, RecognizedGesture } from '@/types';
import { HologramPrimitive } from './HologramPrimitive';

interface SceneCanvasProps {
  objects: Object3DData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  gridVisible: boolean;
  axesVisible: boolean;
  gesture: RecognizedGesture | null;
  onUpdateObject?: (id: string, updates: Partial<Object3DData>) => void;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  objects,
  selectedId,
  onSelect,
  gridVisible,
  axesVisible,
  gesture,
  onUpdateObject,
}) => {
  const controlsRef = useRef<any>(null);

  // Apply gesture-based rotation or translation if object selected
  React.useEffect(() => {
    if (!gesture || !selectedId || !onUpdateObject) return;

    if (gesture.type === 'OPEN_PALM') {
      // Rotate selected object slowly according to hand position
      const selected = objects.find((o) => o.id === selectedId);
      if (selected) {
        onUpdateObject(selectedId, {
          rotation: {
            ...selected.rotation,
            y: (selected.rotation.y + 2) % 360,
          },
        });
      }
    } else if (gesture.type === 'PINCH') {
      // Translate object slightly towards hand normalized coordinates
      const selected = objects.find((o) => o.id === selectedId);
      if (selected) {
        const targetX = (gesture.position.x - 0.5) * 6;
        const targetY = -(gesture.position.y - 0.5) * 4;
        onUpdateObject(selectedId, {
          position: {
            x: selected.position.x + (targetX - selected.position.x) * 0.1,
            y: selected.position.y + (targetY - selected.position.y) * 0.1,
            z: selected.position.z,
          },
        });
      }
    }
  }, [gesture, selectedId, objects, onUpdateObject]);

  return (
    <div className="w-full h-full relative" onClick={() => onSelect(null)}>
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <pointLight position={[-10, -5, -10]} intensity={0.6} color="#00f3ff" />
        <pointLight position={[5, 10, -5]} intensity={0.8} color="#0284c7" />

        {/* Technical Grid & Axes */}
        {gridVisible && (
          <gridHelper
            args={[20, 20, new THREE.Color('#00f3ff'), new THREE.Color('rgba(0,243,255,0.15)')]}
            position={[0, -1, 0]}
          />
        )}
        {axesVisible && <axesHelper args={[3]} position={[0, -1, 0]} />}

        {/* Objects in Scene */}
        {objects.map((obj) => (
          <HologramPrimitive
            key={obj.id}
            data={obj}
            isSelected={selectedId === obj.id}
            onSelect={(id) => onSelect(id)}
          />
        ))}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={1.5}
          maxDistance={25}
        />
      </Canvas>
    </div>
  );
};
