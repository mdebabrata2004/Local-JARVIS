import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Object3DData } from '@/types';

interface HologramPrimitiveProps {
  data: Object3DData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const HologramPrimitive: React.FC<HologramPrimitiveProps> = ({
  data,
  isSelected,
  onSelect,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Subtle sci-fi hover or spin for arc reactor
  useFrame((_, delta) => {
    if (data.type === 'reactor' && meshRef.current) {
      meshRef.current.rotation.z += delta * 0.8;
    }
  });

  const renderGeometry = () => {
    switch (data.type) {
      case 'cube':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.7, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.6, 0.6, 1.2, 32]} />;
      case 'torus':
        return <torusGeometry args={[0.7, 0.25, 24, 48]} />;
      case 'cone':
        return <coneGeometry args={[0.7, 1.3, 32]} />;
      case 'plane':
        return <planeGeometry args={[1.5, 1.5]} />;
      case 'reactor':
        // Sci-Fi Arc Reactor multi-ring
        return <torusGeometry args={[0.8, 0.1, 16, 64]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <group
      position={[data.position.x, data.position.y, data.position.z]}
      rotation={[
        (data.rotation.x * Math.PI) / 180,
        (data.rotation.y * Math.PI) / 180,
        (data.rotation.z * Math.PI) / 180,
      ]}
      scale={[data.scale.x, data.scale.y, data.scale.z]}
      visible={data.visible}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(data.id);
      }}
    >
      <mesh ref={meshRef}>
        {renderGeometry()}
        <meshStandardMaterial
          color={data.color}
          wireframe={data.wireframe}
          roughness={data.roughness}
          metalness={data.metalness}
          transparent={data.opacity < 1.0}
          opacity={data.opacity}
          emissive={isSelected ? new THREE.Color(data.color) : new THREE.Color('#000000')}
          emissiveIntensity={isSelected ? 0.35 : 0}
        />
      </mesh>

      {/* Selected Bounding Ring Accent */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[1.15, 1.15, 1.15]} />
          <meshBasicMaterial
            color="#00f3ff"
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
};
