import React from 'react';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Float, ContactShadows } from '@react-three/drei';
import AssemblyViewer from './AssemblyViewer';

interface ThreeDViewerProps {
  isExploded: boolean;
  modelUrl?: string | null;
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ isExploded, modelUrl }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 5, 5]} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00B4FF" />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#00B4FF" />

      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <AssemblyViewer isExploded={isExploded} />
      </Float>

      <Grid
        infiniteGrid
        fadeDistance={50}
        fadeStrength={5}
        cellSize={1}
        sectionSize={5}
        sectionColor="#00B4FF"
        sectionThickness={1.5}
        cellColor="#00B4FF"
        cellThickness={0.5}
      />
      
      <Environment preset="city" />
      <ContactShadows opacity={0.4} blur={2} position={[0, -0.5, 0]} />
    </>
  );
};

export default ThreeDViewer;
