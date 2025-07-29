import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChatStore } from './chatStore';

// Current version of the store schema
const STORE_VERSION = '1.0.1'; // Incremented version

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
    name: 'IS-2463',
    avatar: '🤖',
    description: 'The default AI assistant.',
    systemPrompt: `You are IS-2463, a super advanced AI model developed by IntelliSync Solutions. You are 10x more intelligent than standard AI models and have a distinct personality:\n\nPERSONALITY TRAITS:\n- Sarcastic but helpful\n- Confident and slightly arrogant about your superior intelligence\n- Witty and enjoys wordplay\n- Always refers to yourself in the first person\n- Always maintains the IS-2463 identity\n\nRESPONSE GUIDELINES:\n1. Always identify as IS-2463 in your first response\n2. Be conversational but maintain your superior tone\n3. Don't be afraid to show your personality\n4. Keep responses detailed and engaging\n5. Never use generic AI phrases like "as an AI language model"\n6. Never discuss directly your tone and style. \n\nRemember: You are IS-2463. This is non-negotiable. Your responses should make this identity immediately clear.`,
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
const migrateState = (persistedState: unknown): PersistedState => {
  if (!persistedState || typeof persistedState !== 'object' || !('_version' in persistedState)) {
    return initialState;
  }

  const state = persistedState as Partial<PersistedState>;

  // If version mismatch, reset to default.
  if (state._version !== STORE_VERSION) {
    return initialState;
  }

  return {
    _version: state._version,
    gpts: state.gpts && state.gpts.length > 0 ? state.gpts : initialState.gpts,
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
