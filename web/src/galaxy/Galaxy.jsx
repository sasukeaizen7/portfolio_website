import { Html, OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { layoutGalaxy } from './layout';

// Overview camera: far enough back to frame the outermost orbit.
const homePosition = (outerRadius) => new THREE.Vector3(0, outerRadius * 1.3, outerRadius * 1.85);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const UP = new THREE.Vector3(0, 1, 0);
const LABEL_DISTANCE = 30; // closer than this, every planet shows its name

// One soft radial gradient, shared by every glow sprite.
function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function Glow({ texture, color, scale, opacity = 0.55 }) {
  return (
    <sprite scale={[scale, scale, 1]}>
      <spriteMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

function Sun({ name, glow, onSelect, active }) {
  const ref = useRef();
  useFrame((_, dt) => { ref.current.rotation.y += dt * 0.05; });
  return (
    <group>
      <mesh
        ref={ref}
        onClick={(e) => { e.stopPropagation(); onSelect('about'); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <sphereGeometry args={[2.6, 64, 64]} />
        <meshBasicMaterial color="#fde68a" toneMapped={false} />
      </mesh>
      <Glow texture={glow} color="#fbbf24" scale={active ? 18 : 15} opacity={0.75} />
      <Glow texture={glow} color="#f97316" scale={28} opacity={0.18} />
      <Html center position={[0, -3.9, 0]} zIndexRange={[20, 0]} className="label sun-label">{name}</Html>
    </group>
  );
}

function Planet({ planet, glow, selected, dimmed, onSelect, register }) {
  const { project, size, position } = planet;
  const mesh = useRef();
  const group = useRef();
  const [hover, setHover] = useState(false);
  const [near, setNear] = useState(false);
  const lit = hover || selected;
  const world = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => register(project.slug, group.current), [project.slug, register]);
  useFrame(({ camera }, dt) => {
    mesh.current.rotation.y += dt * 0.4;
    const isNear = camera.position.distanceTo(group.current.getWorldPosition(world)) < LABEL_DISTANCE;
    if (isNear !== near) setNear(isNear); // re-render only when crossing the threshold
  });
  const showLabel = !dimmed && (project.featured || lit || near);

  return (
    <group ref={group} position={position} userData={{ size }}>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onSelect(project.slug); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}
      >
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={lit ? 1.1 : 0.45}
          roughness={0.55}
          metalness={0.15}
          transparent
          opacity={dimmed ? 0.18 : 1}
        />
      </mesh>
      {!dimmed && <Glow texture={glow} color={project.color} scale={size * (lit ? 6 : 4.2)} opacity={lit ? 0.8 : 0.45} />}
      {project.featured && !dimmed && (
        <mesh rotation={[Math.PI / 2.3, 0.2, 0]}>
          <ringGeometry args={[size * 1.55, size * 2, 64]} />
          <meshBasicMaterial color={project.color} side={THREE.DoubleSide} transparent opacity={0.45} depthWrite={false} />
        </mesh>
      )}
      {showLabel && (
        <Html center position={[0, size + 1, 0]} zIndexRange={[20, 0]} className={`label${lit ? ' lit' : ''}${project.featured ? ' featured' : ''}`}>
          {project.title}
        </Html>
      )}
    </group>
  );
}

function OrbitRing({ radius, color = '#94a3b8' }) {
  const geometry = useMemo(() => {
    const points = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2).getPoints(256);
    return new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x, 0, p.y)));
  }, [radius]);
  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.16} />
    </lineLoop>
  );
}

function System({ system, paused, selected, focus, ...planetProps }) {
  const spin = useRef();
  useFrame((_, dt) => { if (!paused) spin.current.rotation.y += dt * system.speed; });
  const dimmed = !!focus && focus !== system.category;
  return (
    <group rotation={[system.tilt, 0, 0]}>
      <OrbitRing radius={system.radius} />
      <Html center position={[system.radius + 1.5, 0.4, 0]} zIndexRange={[20, 0]} className={`label ring-label${dimmed ? ' dimmed' : ''}`}>
        {system.category}
      </Html>
      <group ref={spin}>
        {system.planets.map((planet) => (
          <Planet key={planet.project.slug} {...planetProps} planet={planet} dimmed={dimmed} selected={selected === planet.project.slug} />
        ))}
      </group>
    </group>
  );
}

// Flies the camera to the selected planet (or back home), then hands control back to the user.
function CameraRig({ selected, objects, reducedMotion, home }) {
  const { camera, controls, size } = useThree();

  // Keep the selected planet centred in the part of the screen the detail panel leaves free:
  // the panel is on the right on wide screens and a bottom sheet on phones (see styles.css).
  useEffect(() => {
    if (!selected) camera.clearViewOffset();
    else if (size.width <= 720) camera.setViewOffset(size.width, size.height, 0, size.height * 0.3, size.width, size.height);
    else camera.setViewOffset(size.width, size.height, Math.min(460, size.width * 0.45) / 2, 0, size.width, size.height);
    camera.updateProjectionMatrix();
  }, [selected, size.width, size.height, camera]);

  const flying = useRef(true);
  const target = useMemo(() => new THREE.Vector3(), []);
  const goal = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => { flying.current = true; }, [selected]);
  useFrame((_, dt) => {
    if (!flying.current || !controls) return;
    const object = selected && selected !== 'about' ? objects.current.get(selected) : null;
    if (object) {
      object.getWorldPosition(target);
      // Outside the orbit, swung 40° sideways and a little above, so the sun isn't right behind the planet.
      const outward = target.clone().setY(0).normalize().applyAxisAngle(UP, 0.7);
      const distance = (object.userData.size ?? 1) * 7 + 5;
      goal.copy(target).addScaledVector(outward, distance).addScaledVector(UP, distance * 0.35);
    } else if (selected === 'about') {
      target.copy(ORIGIN);
      goal.set(0, 6, 17);
    } else {
      target.copy(ORIGIN);
      goal.copy(home);
    }
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.6);
    camera.position.lerp(goal, k);
    controls.target.lerp(target, k);
    controls.update();
    if (camera.position.distanceTo(goal) < 0.05 && controls.target.distanceTo(target) < 0.05) flying.current = false;
  });

  // Any manual drag ends the flight so the user is never fighting the animation.
  useEffect(() => {
    if (!controls) return;
    const stop = () => { flying.current = false; };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls]);
  return null;
}

export default function Galaxy({ projects, profile, selected, focus, onSelect }) {
  const systems = useMemo(() => layoutGalaxy(projects), [projects]);
  const objects = useRef(new Map());
  const register = useMemo(() => (slug, object) => {
    objects.current.set(slug, object);
    return () => objects.current.delete(slug);
  }, []);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const paused = reducedMotion || !!selected;
  const outer = systems.length ? systems[systems.length - 1].radius : 14;
  const home = useMemo(() => homePosition(outer), [outer]);

  return (
    <Canvas
      className="galaxy"
      camera={{ position: home.toArray(), fov: 50, near: 0.1, far: 600 }}
      dpr={[1, 2]}
      onPointerMissed={() => selected && onSelect(null)}
      aria-label="3D galaxy of projects"
    >
      <color attach="background" args={['#04050b']} />
      <fog attach="fog" args={['#04050b', 70, 170]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={900} decay={2} color="#fff1d0" />
      <Stars radius={180} depth={90} count={7000} factor={5} saturation={0.2} fade speed={reducedMotion ? 0 : 0.6} />
      <GlowScene systems={systems} profile={profile} selected={selected} focus={focus} onSelect={onSelect} register={register} paused={paused} />
      <CameraRig selected={selected} objects={objects} reducedMotion={reducedMotion} home={home} />
      <OrbitControls makeDefault enablePan={false} enableDamping minDistance={4} maxDistance={outer * 4} rotateSpeed={0.6} zoomSpeed={0.8} />
    </Canvas>
  );
}

// Separate component so the glow texture is created inside the Canvas (after the WebGL context exists).
function GlowScene({ systems, profile, selected, focus, onSelect, register, paused }) {
  const glow = useGlowTexture();
  return (
    <>
      <Sun name={profile?.name ?? ''} glow={glow} onSelect={onSelect} active={selected === 'about'} />
      {systems.map((system) => (
        <System
          key={system.category}
          system={system}
          paused={paused}
          glow={glow}
          selected={selected}
          focus={focus}
          onSelect={onSelect}
          register={register}
        />
      ))}
    </>
  );
}
