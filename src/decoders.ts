// src/decoders.ts
import { useGLTF } from '@react-three/drei';

// --- DRACO (safe across versions) ---
try {
  // drei >= v8 exposes setDecoderPath
  (useGLTF as any).setDecoderPath?.('https://www.gstatic.com/draco/v1/decoders/');
} catch { /* ignore */ }

// --- Meshopt (feature-detect) ---
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// A) Newer drei: prefer the official setter if available
if ((useGLTF as any).setMeshoptDecoder) {
  (useGLTF as any).setMeshoptDecoder(MeshoptDecoder as any);
} else {
  // B) Fallback for older drei/GLTFLoader versions:
  // Many builds will auto-pick MeshoptDecoder from the global scope
  // if GLTFLoader.setMeshoptDecoder isn’t wired by drei.
  // @ts-expect-error - make it discoverable globally
  (globalThis as any).MeshoptDecoder = MeshoptDecoder;
}

// Optional: clear any cached GLTFs if you changed decoders at runtime
// (useGLTF as any).clear?.();