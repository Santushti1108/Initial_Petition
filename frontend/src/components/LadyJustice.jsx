import { useGLTF, Center } from "@react-three/drei";

export default function LadyJustice() {
  const { scene } = useGLTF("/models/model.glb");

  return (
    <Center>
      <primitive
        object={scene}
        scale={2.4}
        position = {[0,1.3,0]}
        rotation={[0, -0.4, 0]}
      />
    </Center>
  );
}