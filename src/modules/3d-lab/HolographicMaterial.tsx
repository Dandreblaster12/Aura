import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const HolographicMaterialImpl = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('#00B4FF'),
    opacity: 0.5,
    glowInternal: 2.0,
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float opacity;
    uniform float glowInternal;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), glowInternal);
      float scanline = sin(vPosition.y * 50.0 - time * 5.0) * 0.1 + 0.9;
      vec3 finalColor = color * (fresnel + 0.2) * scanline;
      gl_FragColor = vec4(finalColor, fresnel * opacity);
    }
  `
);

extend({ HolographicMaterialImpl });

export default HolographicMaterialImpl;
