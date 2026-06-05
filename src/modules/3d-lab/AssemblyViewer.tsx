import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AssemblyViewerProps {
  isExploded: boolean;
}

const ProceduralPart = ({ position, size, delay = 0 }: { position: [number, number, number]; size: [number, number, number]; delay?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // @ts-ignore
      meshRef.current.material.uniforms.time.value = state.clock.elapsedTime + delay;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={size} />
      {/* @ts-ignore */}
      <holographicMaterialImpl transparent />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color="#00B4FF" linewidth={2} />
      </lineSegments>
    </mesh>
  );
};

const AssemblyViewer: React.FC<AssemblyViewerProps> = ({ isExploded }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const offset = i * (isExploded ? 0.6 : 0);
        child.position.y = THREE.MathUtils.lerp(child.position.y, offset, 0.1);
        child.position.x = THREE.MathUtils.lerp(child.position.x, isExploded ? (i % 2 === 0 ? 0.5 : -0.5) : 0, 0.1);
      });
    }
  });

  return (
    <group ref={groupRef}>
      <ProceduralPart position={[0, 0, 0]} size={[2.2, 0.1, 2.2]} />
      <ProceduralPart position={[0, 0, 0]} size={[1.8, 0.4, 1.8]} delay={0.5} />
      <ProceduralPart position={[0, 0, 0]} size={[1, 0.8, 1]} delay={1.0} />
      <ProceduralPart position={[0, 0, 0]} size={[0.5, 1.2, 0.5]} delay={1.5} />
      <ProceduralPart position={[0, 0, 0]} size={[0.2, 1.8, 0.2]} delay={2.0} />
    </group>
  );
};

export default AssemblyViewer;
