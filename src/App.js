import React, { Suspense, useLayoutEffect } from "react";
import * as THREE from "three";
import { Canvas } from "react-three-fiber";
import { Loader, Stats } from "@react-three/drei";
import { useTexture, Environment } from "@react-three/drei";
import Model from "./P";
import { Reflector } from "./reflector/Reflector";
import useSlerp from "./use-slerp";

function Floor() {
  const textures = useTexture([
    "/Granite_002_COLOR_OCC.jpg",
    "/Granite_002_COLOR_NORM.jpg",
    "/Granite_002_COLOR_DISP.png",
    "/Granite_002_COLOR_ROUGH.jpg",
    "/Granite_002_COLOR_COLOR.jpg",
  ]);
  const [ao, normal, height, roughness, base] = textures;
  useLayoutEffect(() => {
    textures.forEach(
      (texture) =>
        void ((texture.wrapT = texture.wrapS = THREE.RepeatWrapping),
        texture.repeat.set(8, 8))
    );
  }, [textures]);
  return (
    <Reflector
      resolution={1024}
      mirror={0.25}
      blur={[300, 100]}
      mixBlur={1}
      mixStrength={3}
      minDepthThreshold={0.7}
      maxDepthThreshold={1.3}
      depthScale={4}
      depthToBlurRatioBias={0.6}
      rotation={[-Math.PI / 2, 0, 0]}
      args={[16, 16]}
      position={[3, 0, 2]}
      distortion={0.2}
      distortionMap={base}
      debug={0}
    >
      {(Material, props) => (
        <Material
          color="#777"
          metalness={0}
          roughness={2}
          roughnessMap={roughness}
          aoMap={ao}
          normalMap={normal}
          normalScale={[1.1, 1.1]}
          envMapIntensity={0.1}
          bumpMap={height}
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
        <fog attach="fog" args={["#0f2233", 10, 18]} />
        <ambientLight intensity={0.4} />
        <spotLight
          position={[-15, 10, 5]}
          intensity={4}
          penumbra={1}
          angle={Math.PI / 4}
          distance={30}
        />
        <Suspense fallback={null}>
          <Scene />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      <Loader />
      <Stats />
    </>
  );
}
