import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useGptsStore } from './gptsStore';
import { DEFAULT_GPT_SYSTEM_PROMPT } from '@/config/branding';
import { useUserStore } from './userStore';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  smartPrompts?: string[];
}

export interface ChatSession {
  id: string;
  gptId: string;
  title: string;
  createdAt: string;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  sessions: Record<string, ChatSession>;
  activeSessionId: string | null;
  createSession: (gptId: string, title?: string) => string; // Returns new session ID
  setActiveSessionId: (sessionId: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  appendToLastMessage: (sessionId: string, chunk: string) => void;
  addSmartPrompts: (sessionId: string, prompts: string[]) => void;
  setError: (sessionId: string, error: string | null) => void;
  setLoading: (sessionId: string, isLoading: boolean) => void;
  sendMessage: (messageContent: string) => Promise<void>;
  deleteSessionsForGpt: (gptId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  deleteSession: (sessionId: string) => void;
}

const initialState = {
  sessions: {},
  activeSessionId: null,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

  createSession: (gptId, title = 'New Chat') => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      gptId,
      title,
      createdAt: new Date().toISOString(),
      messages: [],
      isLoading: false,
      error: null,
    };
    set(state => ({
      sessions: { ...state.sessions, [newSessionId]: newSession },
    }));
    return newSessionId;
  },

  // Reset to initial state if needed, for debugging or user action
  reset: () => set(initialState),

  setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),

  addMessage: (sessionId, message) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session) return {};
      const newSession = { 
        ...session, 
        messages: [...session.messages, message]
      };
      return { sessions: { ...state.sessions, [sessionId]: newSession } };
    }),

  appendToLastMessage: (sessionId, chunk) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session || session.messages.length === 0) return {};

      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage.role !== 'assistant') return {};

      const updatedLastMessage = { ...lastMessage, content: lastMessage.content + chunk };
      const updatedMessages = [...session.messages.slice(0, -1), updatedLastMessage];
      const newSession = { ...session, messages: updatedMessages };

      return { sessions: { ...state.sessions, [sessionId]: newSession } };
    }),

  addSmartPrompts: (sessionId, prompts) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session || session.messages.length === 0) return {};

      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage.role !== 'assistant') return {};

      const updatedLastMessage = { ...lastMessage, smartPrompts: prompts };
      const updatedMessages = [...session.messages.slice(0, -1), updatedLastMessage];
      const newSession = { ...session, messages: updatedMessages };

      return { sessions: { ...state.sessions, [sessionId]: newSession } };
    }),

  setLoading: (sessionId, isLoading) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session) return {};
      const newSession = { ...session, isLoading };
      return { sessions: { ...state.sessions, [sessionId]: newSession } };
    }),

  setError: (sessionId, error) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session) return {};
      const newSession = { ...session, error };
      return { sessions: { ...state.sessions, [sessionId]: newSession } };
    }),

  sendMessage: async (messageContent: string) => {
    const { activeGptId, gpts } = useGptsStore.getState();
    if (!activeGptId) return;

    const activeGpt = gpts.find(g => g.id === activeGptId);
    if (!activeGpt) {
      console.error("Active GPT not found!");
      return;
    }

    let sessionId = get().activeSessionId;

    // Step 1: Atomically update state to create session (if needed) and add user message.
    set(state => {
      const newSessions = { ...state.sessions };
      let newActiveSessionId = state.activeSessionId;

      // If no active session or active session is for a different GPT, create a new one.
      if (!newActiveSessionId || newSessions[newActiveSessionId]?.gptId !== activeGptId) {
        newActiveSessionId = `session-${Date.now()}`;
        sessionId = newActiveSessionId; // Update outer scope sessionId
        newSessions[newActiveSessionId] = {
          id: newActiveSessionId,
          gptId: activeGptId,
          title: 'New Chat',
          createdAt: new Date().toISOString(),
          messages: [],
          isLoading: true, // Set loading true from the start
          error: null,
        };
      }

      // Add user message to the session
      const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: messageContent };
      newSessions[sessionId!].messages.push(userMessage);

      // Add a placeholder for the assistant's response
      const assistantMessage: Message = { id: `msg-${Date.now()}-assistant`, role: 'assistant', content: '' };
      newSessions[sessionId!].messages.push(assistantMessage);

      // Ensure loading is set
      newSessions[sessionId!].isLoading = true;
      newSessions[sessionId!].error = null;

      return { sessions: newSessions, activeSessionId: newActiveSessionId };
    });

    // After state update, sessionId is guaranteed to be set.
    const currentSessionId = get().activeSessionId!;

    // Step 2: Perform the API call.
    try {
      const { apiKey } = useUserStore.getState();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-User-API-Key'] = apiKey;

      const currentMessages = get().sessions[currentSessionId].messages;
      
      // Debug logging
      console.log('Active GPT object:', activeGpt);
      const effectiveSystemPrompt =
        activeGpt.id === 'gpt-default'
          ? DEFAULT_GPT_SYSTEM_PROMPT
          : (activeGpt.systemPrompt || DEFAULT_GPT_SYSTEM_PROMPT);
      console.log('System prompt being sent:', effectiveSystemPrompt);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
                body: JSON.stringify({
          system_prompt: effectiveSystemPrompt,
          messages: currentMessages
            .slice(0, -1)
            .map(({ role, content }) => ({ role, content })), // exclude placeholder and strip id/smartPrompts
          model: 'gpt-4o', // Use a valid backend model name
          temperature: activeGpt.temperature,
          top_p: activeGpt.topP,
          frequency_penalty: activeGpt.frequencyPenalty,
          max_tokens: activeGpt.maxTokens,
          gptId: activeGptId,
        }),
      });

      if (!response.ok || !response.body) throw new Error(`API error: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const delimiter = '||SMART_PROMPTS||';
      let promptsFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (!promptsFound) {
          const delimiterIndex = buffer.indexOf(delimiter);
          if (delimiterIndex !== -1) {
            get().appendToLastMessage(currentSessionId, buffer.substring(0, delimiterIndex));
            buffer = buffer.substring(delimiterIndex + delimiter.length);
            promptsFound = true;
          } else {
            get().appendToLastMessage(currentSessionId, buffer);
            buffer = '';
          }
        }
      }

      if (promptsFound && buffer.length > 0) {
        try {
          get().addSmartPrompts(currentSessionId, JSON.parse(buffer));
        } catch (e) { console.error('Failed to parse smart prompts JSON:', e); }
      } else if (buffer.length > 0) {
        get().appendToLastMessage(currentSessionId, buffer);
      }

    } catch (error) {
      console.error('Failed to fetch streaming response:', error);
      get().setError(currentSessionId, 'Failed to get a response from the assistant.');
    } finally {
      get().setLoading(currentSessionId, false);
    }
  },

  deleteSessionsForGpt: (gptId) =>
    set(state => {
      const newSessions = { ...state.sessions };
      Object.keys(newSessions).forEach(sessionId => {
        if (newSessions[sessionId].gptId === gptId) {
          delete newSessions[sessionId];
        }
      });
      return { sessions: newSessions };
    }),

  renameSession: (sessionId, newTitle) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session) return {};
      const newSession = { ...session, title: newTitle };
      return { sessions: { ...state.sessions, [sessionId]: newSession } };
    }),

  deleteSession: (sessionId: string) => {
    set(state => {
      const newSessions = { ...state.sessions };
      delete newSessions[sessionId];
      
      // If we deleted the active session, update the active session ID
      if (state.activeSessionId === sessionId) {
        // Find another session to activate, if any exist
        const remainingSessions = Object.values(newSessions);
        if (remainingSessions.length > 0) {
          // Try to find another session for the same GPT
          const { activeGptId } = useGptsStore.getState();
          const gptSessions = remainingSessions.filter(s => s.gptId === activeGptId);
          
          if (gptSessions.length > 0) {
            // Sort by creation date to get the most recent
            gptSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return {
              sessions: newSessions,
              activeSessionId: gptSessions[0].id,
            };
          } else if (remainingSessions.length > 0) {
            // If no sessions for current GPT, just pick the first available
            return {
              sessions: newSessions,
              activeSessionId: remainingSessions[0].id,
            };
          }
        }
        
        // If we get here, there are no sessions left
        return {
          sessions: newSessions,
          activeSessionId: null,
        };
      }

      return { sessions: newSessions };
    });
  },
}),
    {
      name: 'chat-storage', // unique name for local storage
      partialize: (state) => ({ 
        sessions: state.sessions, 
        activeSessionId: state.activeSessionId 
      }),
    }
  )
);
