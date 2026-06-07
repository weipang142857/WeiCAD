import type { SceneModel, Quality } from '../contracts/sceneModel';
import type { DisplayMode } from '../viewer/Viewer';

export interface SectionState { on: boolean; axis: 'x' | 'y' | 'z'; offset: number; }

export interface AppState {
  model: SceneModel | null;
  partVisibility: Record<string, boolean>;
  selectedPartId: string | null;
  displayMode: DisplayMode;
  section: SectionState;
  measureMode: boolean;
  quality: Quality;
  loading: boolean;
  error: string | null;
}

export const initialState: AppState = {
  model: null,
  partVisibility: {},
  selectedPartId: null,
  displayMode: 'shaded-edges',
  section: { on: false, axis: 'z', offset: 0 },
  measureMode: false,
  quality: 'normal',
  loading: false,
  error: null,
};

export type Action =
  | { type: 'loadStart' }
  | { type: 'loaded'; model: SceneModel }
  | { type: 'clearModel' }
  | { type: 'error'; message: string }
  | { type: 'togglePart'; id: string }
  | { type: 'selectPart'; id: string | null }
  | { type: 'setDisplayMode'; mode: DisplayMode }
  | { type: 'setSection'; section: SectionState }
  | { type: 'setMeasure'; on: boolean }
  | { type: 'setQuality'; quality: Quality };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'loadStart': return { ...state, loading: true, error: null };
    case 'loaded': {
      const partVisibility: Record<string, boolean> = {};
      for (const p of action.model.parts) partVisibility[p.id] = true;
      return { ...state, model: action.model, partVisibility, selectedPartId: null, loading: false, error: null };
    }
    case 'clearModel':
      return {
        ...state,
        model: null,
        partVisibility: {},
        selectedPartId: null,
        section: initialState.section,
        measureMode: false,
        loading: false,
        error: null,
      };
    case 'error': return { ...state, error: action.message, loading: false };
    case 'togglePart':
      return { ...state, partVisibility: { ...state.partVisibility, [action.id]: !state.partVisibility[action.id] } };
    case 'selectPart': return { ...state, selectedPartId: action.id };
    case 'setDisplayMode': return { ...state, displayMode: action.mode };
    case 'setSection': return { ...state, section: action.section };
    case 'setMeasure': return { ...state, measureMode: action.on };
    case 'setQuality': return { ...state, quality: action.quality };
    default: return state;
  }
}
