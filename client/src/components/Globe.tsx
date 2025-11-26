import { useEffect, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import type { Country } from "../types";
import earthTextureUrl from "../assets/earth.jpg";

type Props = {
  countries: Country[];
  selectedCountry?: string;
  onSelect: (code: string) => void;
};

function EarthMesh() {
  const texture = useLoader(THREE.TextureLoader, earthTextureUrl);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        color="#ffffff"
        emissive="#0a1c30"
        emissiveIntensity={0.3}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

export function Globe({ countries, selectedCountry, onSelect }: Props) {
  const markers = useMemo(
    () =>
      countries.map((c) => ({
        ...c,
        position: latLonToVector3(c.lat, c.lon, 2)
      })),
    [countries]
  );

  const borderPositions = useMemo(() => {
    const geojson: any = feature(worldData as any, (worldData as any).objects.countries);
    const positions: number[] = [];
    geojson.features.forEach((f: any) => {
      const geom = f.geometry;
      const polys =
        geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
      polys.forEach((poly: any) => {
        poly.forEach((ring: any) => {
          for (let i = 0; i < ring.length - 1; i++) {
            const [lonA, latA] = ring[i];
            const [lonB, latB] = ring[i + 1];
            const a = latLonToVector3(latA, lonA, 2.002);
            const b = latLonToVector3(latB, lonB, 2.002);
            positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
          }
        });
      });
    });
    return new Float32Array(positions);
  }, []);

  const borderGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(borderPositions, 3));
    return g;
  }, [borderPositions]);

  return (
    <div className="globe-wrap panel">
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Stars radius={80} depth={50} count={2000} factor={4} fade />
        <EarthMesh />
        <lineSegments geometry={borderGeometry}>
          <lineBasicMaterial color="#0cf2ff" transparent opacity={0.3} />
        </lineSegments>
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
          <span>Click a marker to load that country's searches</span>
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
