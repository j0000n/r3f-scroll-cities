import { create } from 'zustand';

export type City = {
  name: string;
  tagline: string;
  paragraph: string;
};

type State = {
  section: number;
  progress: number;
  setSection: (n: number) => void;
  setProgress: (p: number) => void;
};

export const useSceneStore = create<State>((set) => ({
  section: 0,
  progress: 0,
  setSection: (n) => set({ section: n }),
  setProgress: (p) => set({ progress: p }),
}));

export const CONFIG = {
    SECTIONS: 11,              // used if AUTO_SECTIONS is false
    AUTO_SECTIONS: true,       // <- set true to use number of models instead
    SMOOTH_SCROLL: true,
    RANDOMIZE_CITIES: true,
    WORLD_TURN_PER_SECTION: 0.2,
    FAR_Z_STEP: -8,
  };
