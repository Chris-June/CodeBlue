import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChatStore } from './chatStore';
import { DEFAULT_GPT_NAME, DEFAULT_GPT_SYSTEM_PROMPT } from '@/config/branding';

// Current version of the store schema
// Bump when we need to run migrations that change defaults.
const STORE_VERSION = '1.0.3';

// Interface for the GPT model
export interface Gpt {
  id: string;
  name: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  maxTokens: number;
}

// Interface for the persisted state (the part we save to localStorage)
interface PersistedState {
  _version: string;
  gpts: Gpt[];
  activeGptId: string | null;
}

// Interface for the full store state, including actions
interface GptsState extends PersistedState {
  addGpt: (gpt: Gpt) => void;
  setActiveGptId: (id: string) => void;
  createNewSessionForActiveGpt: () => void;
  deleteAllGpts: () => void;
  deleteGpt: (id: string) => void;
  updateGpt: (id: string, updatedGpt: Partial<Gpt>) => void;
}

// Default GPT definitions
const defaultGpts: Gpt[] = [
  {
    id: 'gpt-default',
    name: DEFAULT_GPT_NAME,
    avatar: '🤖',
    description: 'The default AI assistant.',
    systemPrompt: DEFAULT_GPT_SYSTEM_PROMPT,
    temperature: 0.8,
    topP: 1,
    frequencyPenalty: 0,
    maxTokens: 1024,
  },
];

// A base state that includes non-function properties for initialization
const initialState: PersistedState = {
  _version: STORE_VERSION,
  gpts: [...defaultGpts],
  activeGptId: 'gpt-default',
};

// Migration function to handle state updates between versions
/**
 * Minimal migration: preserve user data and bump version.
 * No renaming of GPTs occurs here so branding can be controlled via UI display logic.
 */
const migrateState = (persistedState: unknown): PersistedState => {
  if (!persistedState || typeof persistedState !== 'object' || !('_version' in persistedState)) {
    return initialState;
  }

  const state = persistedState as Partial<PersistedState>;

  return {
    _version: STORE_VERSION,
    gpts: Array.isArray(state.gpts) && state.gpts.length > 0 ? state.gpts : initialState.gpts,
    activeGptId: state.activeGptId || initialState.activeGptId,
  };
};

export const useGptsStore = create<GptsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addGpt: (gpt: Gpt) => {
        const { createSession, setActiveSessionId } = useChatStore.getState();
        const newSessionId = createSession(gpt.id);
        setActiveSessionId(newSessionId);

        set((state) => ({
          gpts: [...state.gpts, gpt],
          activeGptId: gpt.id,
        }));
      },

      setActiveGptId: (id: string) => {
        set({ activeGptId: id });
      },

      createNewSessionForActiveGpt: () => {
        const { activeGptId } = get();
        if (!activeGptId) return;

        const { createSession, setActiveSessionId } = useChatStore.getState();
        const newSessionId = createSession(activeGptId);
        setActiveSessionId(newSessionId);
      },

      deleteAllGpts: () => {
        set({ ...initialState });
      },

      deleteGpt: (id: string) => {
        if (id === 'gpt-default') return; // Prevent deleting default GPT

        set((state) => {
          const newGpts = state.gpts.filter((gpt) => gpt.id !== id);
          const newActiveGptId = state.activeGptId === id ? 'gpt-default' : state.activeGptId;
          return {
            gpts: newGpts,
            activeGptId: newActiveGptId,
          };
        });
      },

      updateGpt: (id: string, updatedGpt: Partial<Gpt>) => {
        set((state) => ({
          gpts: state.gpts.map((gpt) =>
            gpt.id === id ? { ...gpt, ...updatedGpt } : gpt
          ),
        }));
      },
    }),
    {
      name: 'gpts-storage',
      merge: (persistedState, currentState) => {
        const migratedState = migrateState(persistedState);
        return { ...currentState, ...migratedState };
      },
      partialize: (state): PersistedState => ({
        _version: state._version,
        gpts: state.gpts,
        activeGptId: state.activeGptId,
      }),
    }
  )
);
