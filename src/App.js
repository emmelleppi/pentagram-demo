import React, { Suspense, useLayoutEffect } from "react";
import * as THREE from "three";
import { Canvas } from "react-three-fiber";
import { Loader } from "@react-three/drei";
import { useTexture, Environment } from "@react-three/drei";
import Model from "./Model";
import { Reflector } from "./reflector/Reflector";
import useSlerp from "./use-slerp";

function Floor() {
  const textures = useTexture([
    "/SurfaceImperfections003_2K_Normal.jpg",
    "/SurfaceImperfections003_2K_var1.jpg",
  ]);
  const [normal, roughness] = textures;
  useLayoutEffect(() => {
    textures.forEach(
      (texture) =>
        void ((texture.wrapT = texture.wrapS = THREE.RepeatWrapping),
        texture.repeat.set(4, 4))
    );
  }, [textures]);
  return (
    <Reflector
      resolution={1024}
      mirror={1}
      blur={[150, 200]}
      mixBlur={8}
      mixStrength={5}
      minDepthThreshold={0.5}
      maxDepthThreshold={2}
      depthScale={4}
      depthToBlurRatioBias={0.7}
      rotation={[-Math.PI / 2, 0, 0]}
      args={[16, 16]}
      position={[3, 0, 2]}
      distortion={0.1}
      distortionMap={roughness}
      debug={0}
    >
      {(Material, props) => (
        <Material
          color="#a0a0a0"
          metalness={0.2}
          roughness={1}
          roughnessMap={roughness}
          normalMap={normal}
          normalScale={[0.5, 0.5]}
          envMapIntensity={0.08}
          {...props}
        />
      )}
    </Reflector>
  );
}

function Scene() {
  const group = useSlerp();
  return (
    <group ref={group} position-y={-1}>
      <Floor />
      <Model />
    </group>
  );
}

export default function App() {
  return (
    <>
      <Canvas
        pixelRatio={[1, 1.5]}
        camera={{ position: [10, -0.5, 9], fov: 15 }}
        onCreated={({ camera }) =>
          void (camera.lookAt(2.5, -0.4, 0), camera.updateMatrixWorld())
        }
      >
        <color attach="background" args={["black"]} />
        <fog attach="fog" args={["black", 9, 16]} />
        <ambientLight intensity={0.1} />
        <Suspense fallback={null}>
          <Scene />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
