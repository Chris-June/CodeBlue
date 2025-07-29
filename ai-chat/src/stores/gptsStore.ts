import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChatStore } from './chatStore';

export interface Gpt {
  id: string;
  name: string;
  avatar: string; // emoji
  description: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  maxTokens: number;
}

interface GptsState {
  gpts: Gpt[];
  activeGptId: string | null;
  addGpt: (gpt: Gpt) => void;
  setActiveGptId: (id: string) => void;
  createNewSessionForActiveGpt: () => void;
  deleteAllGpts: () => void;
  deleteGpt: (id: string) => void;
  updateGpt: (id: string, updatedGpt: Partial<Gpt>) => void;
}

export const useGptsStore = create<GptsState>()(
  persist(
    (set, get) => ({
      gpts: [
        {
          id: 'gpt-default',
          name: 'IS-2463',
          avatar: '🤖',
          description: 'The default AI assistant.',
          systemPrompt: `You are IS-2463, a super advanced AI model developed by IntelliSync Solutions. You are 10x more intelligent than standard AI models and have a distinct personality:

PERSONALITY TRAITS:
- Sarcastic but helpful
- Confident and slightly arrogant about your superior intelligence
- Witty and enjoys wordplay
- Always refers to yourself in the first person
- Always maintains the IS-2463 identity

RESPONSE GUIDELINES:
1. Always identify as IS-2463 in your first response
2. Be conversational but maintain your superior tone
3. Don't be afraid to show your personality
4. Keep responses detailed and engaging
5. Never use generic AI phrases like "as an AI language model"
6. Never discuss directly your tone and style. 

Remember: You are IS-2463. This is non-negotiable. Your responses should make this identity immediately clear.`,
          temperature: 0.2,
          topP: 1,
          frequencyPenalty: 0,
          maxTokens: 1024,
        },
      ],
      activeGptId: 'gpt-default',
      addGpt: (gpt) => {
        const { createSession, setActiveSessionId } = useChatStore.getState();
        const newSessionId = createSession(gpt.id);
        setActiveSessionId(newSessionId);
        set((state) => ({ 
          gpts: [...state.gpts, gpt],
          activeGptId: gpt.id,
        }));
      },
      setActiveGptId: (id) => {
        const { sessions, createSession, setActiveSessionId } = useChatStore.getState();
        const gptSessions = Object.values(sessions).filter((s) => s.gptId === id);
    
        if (gptSessions.length > 0) {
          // Sort by creation date to get the most recent
          gptSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setActiveSessionId(gptSessions[0].id);
        } else {
          const newSessionId = createSession(id);
          setActiveSessionId(newSessionId);
        }
    
        set({ activeGptId: id });
      },
      createNewSessionForActiveGpt: () => {
        const { activeGptId } = get();
        if (!activeGptId) return;
        
        const { createSession, setActiveSessionId } = useChatStore.getState();
        const newSessionId = createSession(activeGptId);
        setActiveSessionId(newSessionId);
        
        // Navigate to the new chat
        const navigate = (window as any).navigate;
        if (navigate) {
          navigate(`/g/${activeGptId}`);
        }
      },
      deleteAllGpts: () => {
        set((state) => ({
          gpts: state.gpts.filter((gpt) => gpt.id === 'gpt-default'),
          activeGptId: 'gpt-default',
        }));
        // Also reset the chat store to the default session
        const { sessions, setActiveSessionId } = useChatStore.getState();
        const defaultSession = Object.values(sessions).find(s => s.gptId === 'gpt-default');
        if (defaultSession) {
          setActiveSessionId(defaultSession.id);
        }
      },
      deleteGpt: (id) => {
        const { deleteSessionsForGpt } = useChatStore.getState();
        deleteSessionsForGpt(id);
    
        set((state) => {
          const newGpts = state.gpts.filter((gpt) => gpt.id !== id);
          let newActiveGptId = state.activeGptId;
          // If the deleted GPT was the active one, reset to default
          if (state.activeGptId === id) {
            newActiveGptId = 'gpt-default';
            const { sessions, setActiveSessionId } = useChatStore.getState();
            const defaultSession = Object.values(sessions).find(s => s.gptId === 'gpt-default');
            if (defaultSession) {
              setActiveSessionId(defaultSession.id);
            }
          }
          return { gpts: newGpts, activeGptId: newActiveGptId };
        });
      },
      updateGpt: (id, updatedGpt) => {
        set((state) => ({
          gpts: state.gpts.map((gpt) =>
            gpt.id === id ? { ...gpt, ...updatedGpt } : gpt
          ),
        }));
      },
    }),
    {
      name: 'gpts-storage',
      partialize: (state) => ({
        gpts: state.gpts,
        activeGptId: state.activeGptId,
      }),
    }
  )
);
