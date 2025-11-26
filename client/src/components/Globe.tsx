import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { Country } from "../types";

type Props = {
  countries: Country[];
  selectedCountry?: string;
  onSelect: (code: string) => void;
};

export function Globe({ countries, selectedCountry, onSelect }: Props) {
  const markers = useMemo(
    () =>
      countries.map((c) => ({
        ...c,
        position: latLonToVector3(c.lat, c.lon, 2)
      })),
    [countries]
  );

  return (
    <div className="globe-wrap panel">
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Stars radius={80} depth={50} count={2000} factor={4} fade />
        <mesh>
          <sphereGeometry args={[2, 64, 64]} />
          <meshStandardMaterial
            color="#0b2038"
            emissive="#102844"
            roughness={0.6}
            metalness={0.15}
          />
        </mesh>
        {markers.map((m) => (
          <mesh
            key={m.code}
            position={m.position}
            onClick={() => onSelect(m.code)}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => (document.body.style.cursor = "default")}
          >
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial
              color={m.code === selectedCountry ? "#5dd6ff" : "#ffc857"}
              emissive={m.code === selectedCountry ? "#5dd6ff" : "#3a2a00"}
            />
          </mesh>
        ))}
        <OrbitControls enablePan={false} rotateSpeed={0.6} zoomSpeed={0.6} />
      </Canvas>
      <div className="globe-overlay">
        <div className="legend">
          <span className="dot" />
          <span>Click a marker to load that country’s searches</span>
        </div>
      </div>
    </div>
  );
}

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}
