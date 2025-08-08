import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CONFIG, useSceneStore } from './store';
import { RootCanvas } from './components/Scene';
import OverrideTuner from './views/OverrideTuner';
import { MODEL_ITEMS } from './models.manifest';

const SECTIONS = CONFIG.AUTO_SECTIONS ? Math.max(1, MODEL_ITEMS.length) : CONFIG.SECTIONS;

export default function App() {
  const [hash, setHash] = React.useState<string>(() => window.location.hash);
  React.useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (hash === '#tune') {
    return <OverrideTuner />;
  }

  // normal view (pink background + minimal text)
  const section = useSceneStore(s => s.section);
  const item = MODEL_ITEMS[Math.min(section, MODEL_ITEMS.length - 1)];
  const header = item.file.replace(/\.glb$/i, '');

  return (
    <div className="app">
      <RootCanvas />

      <div className="ui" aria-hidden />
      <AnimatePresence mode="wait">
        <motion.div
          key={header}
          className="hdr"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          {header}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`sub-${item.file}`}
          className="sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {item.file}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}