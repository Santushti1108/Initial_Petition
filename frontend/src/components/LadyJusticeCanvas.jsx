import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import LadyJustice from "./LadyJustice";

export default function LadyJusticeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 40}}
    >
      <ambientLight intensity={2} />

      <directionalLight
        position={[15, 15, 15]}
        intensity={4}
      />

      <pointLight
        position={[0, 0, 0]}
        intensity={45}
        color="#facc15"
      />

      <Float
        speed={1.5}
        rotationIntensity={0.1}
        floatIntensity={0.2}
      >
        <LadyJustice />
      </Float>

      <OrbitControls
        enableZoom={false}
        autoRotate={true}
      />
    </Canvas>
  );
}