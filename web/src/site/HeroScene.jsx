import { Html } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// The hero's 3D background: a slowly turning spiral galaxy of data points, with the featured
// projects as bright worlds orbiting inside it. Moving the pointer tilts it; clicking a world opens the project.

const ARMS = 3;
const RADIUS = 7.5;
const INNER = new THREE.Color('#fde68a');
const MIDDLE = new THREE.Color('#2dd4bf');
const OUTER = new THREE.Color('#8b5cf6');

function useGalaxyPoints(count) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; // deterministic: same galaxy every visit
    for (let i = 0; i < count; i++) {
      const r = Math.pow(rand(), 0.7) * RADIUS;
      const arm = ((i % ARMS) / ARMS) * Math.PI * 2;
      const spin = r * 0.85;
      const spread = (1 - r / RADIUS) * 0.35 + 0.12;
      const jitter = () => Math.pow(rand(), 3) * (rand() < 0.5 ? -1 : 1) * spread * r;
      positions[i * 3] = Math.cos(arm + spin) * r + jitter();
      positions[i * 3 + 1] = jitter() * 0.35;
      positions[i * 3 + 2] = Math.sin(arm + spin) * r + jitter();
      const t = r / RADIUS;
      color.copy(INNER).lerp(MIDDLE, Math.min(1, t * 2)).lerp(OUTER, Math.max(0, t * 2 - 1));
      colors.set([color.r, color.g, color.b], i * 3);
    }
    return { positions, colors };
  }, [count]);
}

function World({ project, index, total, onOpen, glow }) {
  const ref = useRef();
  const [hover, setHover] = useState(false);
  const radius = 2.6 + (index % 3) * 1.45;
  const speed = 0.12 / (1 + index * 0.15);
  const phase = (index / total) * Math.PI * 2;

  useFrame(({ clock }) => {
    const a = phase + clock.elapsedTime * speed;
    ref.current.position.set(Math.cos(a) * radius, Math.sin(a * 2) * 0.25, Math.sin(a) * radius);
  });

  return (
    <group ref={ref}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onOpen(project.slug); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}
        scale={hover ? 1.35 : 1}
      >
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshBasicMaterial color={project.color} toneMapped={false} />
      </mesh>
      <sprite scale={hover ? 2.4 : 1.6}>
        <spriteMaterial map={glow} color={project.color} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {hover && <Html center position={[0, 0.6, 0]} className="hero-world-label">{project.title}</Html>}
    </group>
  );
}

function Scene({ projects, onOpen, reducedMotion }) {
  const group = useRef();
  const { size } = useThree();
  const wide = size.width > 900;
  const { positions, colors } = useGalaxyPoints(wide ? 9000 : 5000);
  const glow = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame(({ pointer }, dt) => {
    if (!reducedMotion) group.current.rotation.y += dt * 0.04;
    // Gentle parallax towards the pointer.
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.45 + pointer.y * 0.12, 0.04);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -pointer.x * 0.08, 0.04);
  });

  return (
    // On wide screens the galaxy sits on the right, beside the text; on phones it fills the background.
    <group position={wide ? [4.6, -0.2, 0] : [0, -1.2, -2]}>
      <group ref={group} rotation={[0.45, 0, 0]}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={wide ? 0.045 : 0.05} sizeAttenuation vertexColors transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
        <sprite scale={4.5}>
          <spriteMaterial map={glow} color="#fbbf24" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        {projects.map((p, i) => <World key={p.slug} project={p} index={i} total={projects.length} onOpen={onOpen} glow={glow} />)}
      </group>
    </group>
  );
}

export default function HeroScene({ projects, onOpen, active }) {
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  return (
    <Canvas
      className="hero-canvas"
      camera={{ position: [0, 0, 11], fov: 45 }}
      dpr={[1, 2]}
      frameloop={active && !reducedMotion ? 'always' : 'demand'}
      aria-hidden="true"
    >
      <Scene projects={projects} onOpen={onOpen} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
