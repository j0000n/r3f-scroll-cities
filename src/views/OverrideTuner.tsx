import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneStore } from '../store';
import { MODEL_ITEMS } from '../models.manifest';
import { RootCanvas, Override } from '../components/Scene';

type OV = NonNullable<Override>;

function numberOrUndef(v: string): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function OverrideTuner() {
  const section = useSceneStore(s => s.section);
  const item = MODEL_ITEMS[Math.min(section, MODEL_ITEMS.length - 1)];
  const [resetVersion, setResetVersion] = React.useState(0);

  // keep a map of filename -> overrides (runtime)
  const [map, setMap] = React.useState<Record<string, OV>>({});

  const current = map[item.file] ?? {};

  function setCurrent(partial: Partial<OV>) {
    setMap(m => {
      const prev = m[item.file] ?? {};
      const next = { ...prev, ...partial };
      // normalize empty offset
      if (partial.offset) next.offset = partial.offset as [number, number, number];
      return { ...m, [item.file]: next };
    });
    setResetVersion(v => v + 1); // restart transforms on each change
  }

  function copyJSON() {
    // only include files with at least one non-default field
    const out: Record<string, OV> = {};
    Object.keys(map).forEach(file => {
      const ov = map[file];
      const keep =
        ov.yaw !== undefined ||
        ov.pitch !== undefined ||
        ov.roll !== undefined ||
        ov.scale !== undefined ||
        (ov.offset && ov.offset.some(n => (n ?? 0) !== 0));
      if (keep) out[file] = ov;
    });
    const json = `const MODEL_OVERRIDES: Record<string, Override> = ${JSON.stringify(out, null, 2)};`;
    navigator.clipboard.writeText(json).catch(() => {});
  }

  // simple controls (radians). Offset XYZ.
  return (
    <div className="app" style={{ background: '#fff' }}>
<RootCanvas
  runtimeOverrides={map}
  resetVersion={resetVersion}
  whiteBg
  showBorder
/>
      {/* filename header, top-left like before */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.file}
          className="hdr"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'tween', duration: 0.2 }}
        >
          {item.file}
        </motion.div>
      </AnimatePresence>

      {/* panel, top-right */}
      <div className="panel">
        <div className="row title">Overrides</div>
        <div className="row">
          <label>yaw</label>
          <input type="number" step="0.05" value={current.yaw ?? ''} placeholder="rad"
                 onChange={e => setCurrent({ yaw: numberOrUndef(e.target.value) })}/>
        </div>
        <div className="row">
          <label>pitch</label>
          <input type="number" step="0.05" value={current.pitch ?? ''} placeholder="rad"
                 onChange={e => setCurrent({ pitch: numberOrUndef(e.target.value) })}/>
        </div>
        <div className="row">
          <label>roll</label>
          <input type="number" step="0.05" value={current.roll ?? ''} placeholder="rad"
                 onChange={e => setCurrent({ roll: numberOrUndef(e.target.value) })}/>
        </div>
        <div className="row">
          <label>scale</label>
          <input type="number" step="0.01" value={current.scale ?? ''} placeholder="1.0"
                 onChange={e => setCurrent({ scale: numberOrUndef(e.target.value) })}/>
        </div>
        <div className="row">
          <label>offset x</label>
          <input type="number" step="0.01" value={current.offset?.[0] ?? ''} placeholder="0"
                 onChange={e => setCurrent({ offset: [numberOrUndef(e.target.value) ?? 0, current.offset?.[1] ?? 0, current.offset?.[2] ?? 0] })}/>
        </div>
        <div className="row">
          <label>offset y</label>
          <input type="number" step="0.01" value={current.offset?.[1] ?? ''} placeholder="0"
                 onChange={e => setCurrent({ offset: [current.offset?.[0] ?? 0, numberOrUndef(e.target.value) ?? 0, current.offset?.[2] ?? 0] })}/>
        </div>
        <div className="row">
          <label>offset z</label>
          <input type="number" step="0.01" value={current.offset?.[2] ?? ''} placeholder="0"
                 onChange={e => setCurrent({ offset: [current.offset?.[0] ?? 0, current.offset?.[1] ?? 0, numberOrUndef(e.target.value) ?? 0] })}/>
        </div>

        <div className="row buttons">
          <button onClick={() => setResetVersion(v => v + 1)}>Reset pose</button>
          <button onClick={copyJSON}>Copy JSON</button>
        </div>

        <div className="hint">Edit values (radians/units). Changes restart the pose.<br/>Copy JSON → paste into code.</div>
      </div>
    </div>
  );
}