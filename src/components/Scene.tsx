import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll, Environment, Center, useGLTF } from '@react-three/drei';
import { MathUtils, Group, Vector3, Euler, BoxHelper, Color } from 'three';
import { CONFIG, useSceneStore } from '../store';
import { MODEL_ITEMS } from '../models.manifest';

export type Override = {
  yaw?: number;               // radians
  pitch?: number;             // radians
  roll?: number;              // radians
  scale?: number;             // uniform scale
  offset?: [number, number, number]; // extra XYZ offset after <Center/>
};

type ModelProps = {
  url: string;
  file: string;
  index: number;
  activeIndex: number;
  tSection: number;
  role: 'current' | 'next' | 'past';
  mergedOv: Required<Override>;
  resetVersion: number;     // bump to hard-reset transform
  showBorder?: boolean;
};

const MODEL_FRONT_YAW = Math.PI; // flip to 0 if your GLBs already face the camera

// Default compile-time overrides (optional; tuner runtime overrides merge on top)
const MODEL_OVERRIDES: Record<string, Override> = {
  // "2_7_2025.glb": { yaw: -Math.PI / 2 },
};

// Damping helper
function damp(current: number, target: number, lambda: number, dt: number) {
  return MathUtils.damp(current, target, lambda, dt);
}

function Model({
  url, file, index, activeIndex, tSection, role, mergedOv, resetVersion, showBorder = false
}: ModelProps) {
  const root = React.useRef<Group>(null);
  const idle = React.useRef<Group>(null);
  const { scene } = useGLTF(url);

  // Border around the active/current model (only when showBorder is true)
  const isSelected = !!showBorder && role === 'current';
  const helperRef = React.useRef<BoxHelper | null>(null);

  // temps
  const targetPos = React.useRef(new Vector3());
  const targetRot = React.useRef(new Euler());
  const targetScale = React.useRef(1);
  const targetOpacity = React.useRef(1);

  // Hard reset to baseline when resetVersion changes
  React.useEffect(() => {
    if (!root.current) return;
    root.current.position.set(0, 0, 0);
    root.current.rotation.set(
      0.15 + (mergedOv.pitch ?? 0),
      MODEL_FRONT_YAW + (mergedOv.yaw ?? 0),
      (mergedOv.roll ?? 0)
    );
    root.current.scale.setScalar(mergedOv.scale ?? 1);
    scene.traverse((o: any) => {
      if (o.isMesh && o.material) {
        o.material.transparent = true;
        o.material.opacity = 1;
      }
    });
  }, [resetVersion, mergedOv.pitch, mergedOv.yaw, mergedOv.roll, mergedOv.scale, scene]);

  // Create/destroy the BoxHelper when selection changes
  React.useEffect(() => {
    if (!root.current) return;

    // cleanup old
    if (helperRef.current && helperRef.current.parent) {
      helperRef.current.parent.remove(helperRef.current);
      helperRef.current.geometry?.dispose?.();
      helperRef.current = null;
    }

    if (isSelected) {
      const h = new BoxHelper(root.current, new Color('#333'));
      helperRef.current = h;
      root.current.add(h);
      h.scale.setScalar(1.02);
    }
    return () => {
      if (helperRef.current && helperRef.current.parent) {
        helperRef.current.parent.remove(helperRef.current);
        helperRef.current.geometry?.dispose?.();
        helperRef.current = null;
      }
    };
  }, [isSelected]);

  useFrame((_, dt) => {
    if (!root.current || !idle.current) return;

    const zNear = 0;
    const zFar = CONFIG.FAR_Z_STEP;

    let z = 0, handoffYaw = 0, opacity = 1, scale = 1;

    if (role === 'current') {
      z = MathUtils.lerp(zNear, zFar, tSection);
      handoffYaw = MathUtils.lerp(0, Math.PI, tSection);
      opacity = MathUtils.lerp(1, 0.08, tSection);
      scale = MathUtils.lerp(1, 0.98, tSection);
    } else if (role === 'next') {
      z = MathUtils.lerp(zFar, zNear, tSection);
      handoffYaw = MathUtils.lerp(Math.PI, 0, tSection);
      opacity = MathUtils.lerp(0.08, 1, tSection);
      scale = MathUtils.lerp(0.98, 1, tSection);
    } else {
      const d = Math.max(1, activeIndex - index);
      z = zFar * (d + 0.25);
      handoffYaw = Math.PI;
      opacity = 0.03 * (1 / d);
      scale = 0.98;
    }

    const [ox, oy, oz] = mergedOv.offset ?? [0, 0, 0];

    targetPos.current.set(ox, oy, z + oz);
    targetRot.current.set(
      0.15 + (mergedOv.pitch ?? 0),
      MODEL_FRONT_YAW + (mergedOv.yaw ?? 0) + handoffYaw,
      (mergedOv.roll ?? 0)
    );
    targetScale.current = (mergedOv.scale ?? 1) * scale;
    targetOpacity.current = opacity;

    const r = root.current;
    r.position.x = damp(r.position.x, targetPos.current.x, 8, dt);
    r.position.y = damp(r.position.y, targetPos.current.y, 8, dt);
    r.position.z = damp(r.position.z, targetPos.current.z, 8, dt);

    r.rotation.x = damp(r.rotation.x, targetRot.current.x, 8, dt);
    r.rotation.y = damp(r.rotation.y, targetRot.current.y, 8, dt);
    r.rotation.z = damp(r.rotation.z, targetRot.current.z, 8, dt);

    const s = (r.scale.x + r.scale.y + r.scale.z) / 3;
    const sNext = damp(s, targetScale.current, 8, dt);
    r.scale.setScalar(sNext);

    idle.current.rotation.y += dt * 0.35;

    const op = targetOpacity.current;
    scene.traverse((o: any) => {
      if (o.isMesh && o.material) {
        o.material.transparent = true;
        o.material.opacity = damp(o.material.opacity ?? 1, op, 10, dt);
      }
    });

    if (helperRef.current) helperRef.current.update();
  });

  React.useLayoutEffect(() => {
    scene.traverse((o: any) => {
      if (o.isMesh && o.material) {
        o.material.transparent = true;
        o.material.opacity = 0.999;
      }
    });
  }, [scene]);

  return (
    <group ref={root}>
      <Center disableZ>
        <group ref={idle}>
          <primitive object={scene} />
        </group>
      </Center>
    </group>
  );
}

function Rig({ sections }: { sections: number }) {
  const scroll = useScroll();
  const setProgress = useSceneStore(s => s.setProgress);
  const setSection  = useSceneStore(s => s.setSection);

  useFrame(({ scene }) => {
    const p = scroll.offset;
    setProgress(p);

    const page = p * sections;
    const i = Math.floor(page);
    const t = MathUtils.clamp(page - i, 0, 1);
    setSection(MathUtils.clamp(i, 0, sections - 1));

    const yaw = i * CONFIG.WORLD_TURN_PER_SECTION + t * CONFIG.WORLD_TURN_PER_SECTION;
    scene.rotation.y = yaw;
  });
  return null;
}

// -------- Public API --------
export function RootCanvas({
  runtimeOverrides,
  resetVersion,
  whiteBg = false,
  showBorder = false,
}: {
  runtimeOverrides?: Record<string, Override>;
  resetVersion?: number;
  whiteBg?: boolean;
  showBorder?: boolean;
}) {
  const sections = CONFIG.AUTO_SECTIONS ? Math.max(1, MODEL_ITEMS.length) : CONFIG.SECTIONS;

  // Merge compile-time + runtime overrides
  const mergedMap: Record<string, Required<Override>> = React.useMemo(() => {
    const out: Record<string, Required<Override>> = {};
    for (const m of MODEL_ITEMS) {
      const base = MODEL_OVERRIDES[m.file] ?? {};
      const run = runtimeOverrides?.[m.file] ?? {};
      const merged: Required<Override> = {
        yaw: run.yaw ?? base.yaw ?? 0,
        pitch: run.pitch ?? base.pitch ?? 0,
        roll: run.roll ?? base.roll ?? 0,
        scale: run.scale ?? base.scale ?? 1,
        offset: (run.offset ?? base.offset ?? [0, 0, 0]) as [number, number, number],
      };
      out[m.file] = merged;
    }
    return out;
  }, [runtimeOverrides]);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 50 }}
      gl={{ antialias: true }}
      style={{ background: whiteBg ? '#fff' : undefined }}
    >
      <ScrollControls pages={sections} damping={CONFIG.SMOOTH_SCROLL ? 0.25 : 0.01} snap>
        <Rig sections={sections} />
        <SceneInner
          mergedMap={mergedMap}
          resetVersion={resetVersion ?? 0}
          sections={sections}
          showBorder={showBorder}
        />
      </ScrollControls>
      <Environment preset="studio" environmentIntensity={0.05} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 6]} intensity={1.2} />
    </Canvas>
  );
}

function SceneInner({
  mergedMap, resetVersion, sections, showBorder = false
}: {
  mergedMap: Record<string, Required<Override>>;
  resetVersion: number;
  sections: number;
  showBorder?: boolean;
}) {
  const section = useSceneStore(s => s.section);
  const progress = useSceneStore(s => s.progress);
  const page = progress * sections;
  const i = Math.floor(page);
  const t = MathUtils.clamp(page - i, 0, 1);

  const visibles = new Set<number>([i, Math.min(i + 1, sections - 1)]);
  for (let k = i - 1; k >= Math.max(0, i - 2); k--) visibles.add(k);

  return (
    <>
      {Array.from(visibles).map(idx => {
        let role: 'current' | 'next' | 'past' = 'past';
        if (idx === i) role = 'current';
        else if (idx === i + 1) role = 'next';

        const item = MODEL_ITEMS[idx] ?? MODEL_ITEMS[MODEL_ITEMS.length - 1];
        const mergedOv = mergedMap[item.file]!;
        return (
          <Model
            key={item.file}
            url={item.url}
            file={item.file}
            index={idx}
            activeIndex={section}
            tSection={t}
            role={role}
            mergedOv={mergedOv}
            resetVersion={resetVersion}
            showBorder={showBorder}
          />
        );
      })}
    </>
  );
}