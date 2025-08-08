// src/models.manifest.ts
// Auto-discovers all GLB files under src/models and derives display labels.

type ModelItem = {
    url: string;       // resolved asset URL
    file: string;      // filename only (e.g., "2_7_2025-2.glb")
    label: string;     // pretty label (e.g., "Feb 7, 2025 (v2)")
    date?: string;     // "YYYY-MM-DD" if parsed
    variant?: string;  // e.g., "v2"
  };
  
  // Vite gives us a map of module path -> url
  const raw = import.meta.glob('./models/*.glb', { eager: true, as: 'url' }) as Record<string, string>;
  
  function prettyFromFile(file: string) {
    // Examples: "2_7_2025.glb", "2_7_2025-2.glb", "4_29_2025-3.glb"
    const base = file.replace(/\.glb$/i, '');
    // try to capture M_D_YYYY and optional "-N"
    const m = base.match(/^(\d{1,2})_(\d{1,2})_(\d{4})(?:-(\d+))?$/);
    if (!m) return { label: base, date: undefined, variant: undefined };
  
    const [_, M, D, Y, variantNum] = m;
    const month = Number(M);
    const day = Number(D);
    const year = Number(Y);
  
    // Format date
    const dt = new Date(Date.UTC(year, month - 1, day));
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const labelDate = `${monthNames[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
  
    const variant = variantNum ? `v${variantNum}` : undefined;
    const label = variant ? `${labelDate} (${variant})` : labelDate;
  
    // ISO-ish for sorting/filtering if needed
    const iso = `${year.toString().padStart(4,'0')}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
  
    return { label, date: iso, variant };
  }
  
  // Build and sort by filename
  export const MODEL_ITEMS: ModelItem[] = Object.entries(raw)
    .map(([path, url]) => {
      const file = path.split('/').pop() || path;
      const meta = prettyFromFile(file);
      return { url, file, ...meta };
    })
    .sort((a, b) => a.file.localeCompare(b.file));