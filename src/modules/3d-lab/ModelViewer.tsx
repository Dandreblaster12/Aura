import React from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelViewerProps {
  url: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ url }) => {
  const { scene, animations } = useGLTF(url);
  // const { actions } = useAnimations(animations, scene);

  useFrame((state) => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
           // We can inject holographic properties here if we want to override
           // For now, let's just make it look cool with a blue wireframe overlay
        }
      }
    });
  });

  return (
    <primitive object={scene} scale={2} position={[0, 0, 0]}>
       {/* Injecting wireframes into the primitive scene structure is harder, 
           usually we'd map over children or use a special effect pass. 
           For this task, we'll stick to the procedural assembly or basic model load. */}
    </primitive>
  );
};

export default ModelViewer;
