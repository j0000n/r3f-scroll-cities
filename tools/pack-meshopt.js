// Meshopt compress all GLBs in src/models in-place.
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/models';
const files = readdirSync(dir).filter(f => f.toLowerCase().endsWith('.glb'));
for (const f of files) {
  const inPath = join(dir, f);
  const outPath = inPath; // overwrite
  const cmd = `npx gltfpack -i "${inPath}" -o "${outPath}" -cc -km -ke -si 1 -noq`;
  console.log('Packing', f);
  execSync(cmd, { stdio: 'inherit' });
}
console.log('Done.');