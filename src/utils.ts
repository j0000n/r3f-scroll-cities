export function seededShuffle<T>(arr: T[], seed = 1337): T[] {
  let s = seed >>> 0;
  const a = 1664525, c = 1013904223, m = 2 ** 32;
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    s = (a * s + c) % m;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function randColorFrom(seed: number) {
  const h = (seed * 137) % 360;
  const s = 60;
  const l = 55;
  return `hsl(${h}deg ${s}% ${l}%)`;
}
