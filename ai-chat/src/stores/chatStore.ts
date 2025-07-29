import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useGptsStore } from './gptsStore';
import { useUserStore } from './userStore';
import { useUiStore } from './uiStore';

export interface UrlCitation {
  type: 'url_citation';
  text: string; // The cited text snippet, e.g., "[1]"
  start_index: number;
  end_index: number;
  url: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  smartPrompts?: string[];
  annotations?: UrlCitation[];
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
  isGenerating: boolean; // For the global stop button
  isStreaming: boolean; // For the typing indicator
  abortController: AbortController | null;
  createSession: (gptId: string, title?: string) => string; // Returns new session ID
  setActiveSessionId: (sessionId: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  appendToLastMessage: (sessionId: string, chunk: string) => void;
  addSmartPrompts: (sessionId: string, prompts: string[]) => void;
  addAnnotations: (sessionId: string, annotations: any[]) => void;
  setError: (sessionId: string, error: string | null) => void;
  setLoading: (sessionId: string, isLoading: boolean) => void;
  sendMessage: (messageContent: string) => Promise<void>;
  deleteSessionsForGpt: (gptId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  deleteSession: (sessionId: string) => void;
  stopGenerating: () => void;
}

const initialState = {
  sessions: {},
  activeSessionId: null,
  isGenerating: false,
  isStreaming: false,
  abortController: null,
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

  addAnnotations: (sessionId, annotations) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session || session.messages.length === 0) return {};

      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage.role !== 'assistant') return {};

      const updatedLastMessage = { ...lastMessage, annotations: annotations };
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

  stopGenerating: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isGenerating: false, abortController: null });
  },

  sendMessage: async (messageContent: string) => {
    const { activeGptId, gpts } = useGptsStore.getState();
    const { setLoading, addMessage, updateMessage, addSmartPrompts, setError } = get();

    if (!activeGptId) return console.error('No active GPT selected');
    const activeGpt = gpts.find(gpt => gpt.id === activeGptId);
    if (!activeGpt) return console.error('Active GPT not found');

    const controller = new AbortController();
    set({ isGenerating: true, abortController: controller });

    let currentSessionId = get().activeSessionId;

    // Create a new session if one doesn't exist
    if (!currentSessionId || get().sessions[currentSessionId]?.gptId !== activeGptId) {
      currentSessionId = get().createSession(activeGptId);
      get().setActiveSessionId(currentSessionId);
    }

    const finalSessionId = currentSessionId;
    set({ isStreaming: true }); // Start streaming indicator
    setLoading(finalSessionId, true);

    // Add user message
    addMessage(finalSessionId, { id: `msg-${Date.now()}`, role: 'user', content: messageContent });

    // Add assistant placeholder message
    const assistantId = `msg-${Date.now()}-assistant`;
    addMessage(finalSessionId, { id: assistantId, role: 'assistant', content: '' });

    try {
      const { apiKey } = useUserStore.getState();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-User-API-Key'] = apiKey;

      const { isWebSearchEnabled } = useUiStore.getState();
      const tools = isWebSearchEnabled ? [{ type: 'web_search_preview' }] : [];

      const body = JSON.stringify({
        model: activeGpt.model || 'gpt-4o',
        messages: get().sessions[finalSessionId].messages.filter(m => m.id !== assistantId).map(({ id, smartPrompts, ...rest }) => rest),
        system_prompt: activeGpt.systemPrompt,
        temperature: activeGpt.temperature,
        top_p: activeGpt.topP,
        frequency_penalty: activeGpt.frequencyPenalty,
        max_tokens: activeGpt.maxTokens,
        gptId: activeGptId,
        ...(tools.length > 0 && { tools }),
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const promptsDelimiter = '||SMART_PROMPTS||';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split(promptsDelimiter);
        const contentChunk = parts[0];

        if (contentChunk) {
          fullContent += contentChunk;
          updateMessage(finalSessionId, assistantId, { content: fullContent });
        }

        if (parts.length > 1) {
          const promptsJson = parts[1];
          if (promptsJson) {
            try {
              addSmartPrompts(finalSessionId, JSON.parse(promptsJson));
            } catch (e) { console.error('Failed to parse smart prompts:', e); }
          }
          // Once prompts are found, we assume the main content is done.
          break; 
        }

        // If the buffer contains only content, clear it to avoid re-adding it.
        buffer = '';
      }



    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
        updateMessage(finalSessionId, assistantId, { content: 'Request aborted.' });
      } else {
        console.error('Streaming failed:', error);
        setError(finalSessionId, 'Failed to get response.');
        updateMessage(finalSessionId, assistantId, { content: 'Sorry, something went wrong.' });
      }
    } finally {
      set({ isGenerating: false, abortController: null });
      setLoading(finalSessionId, false);
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

  deleteSession: (sessionId) =>
    set((state) => {
      const newSessions = { ...state.sessions };
      delete newSessions[sessionId];

      // If the deleted session was the active one, reset the active session to clear the UI.
      if (state.activeSessionId === sessionId) {
        return { sessions: newSessions, activeSessionId: null };
      }

      return { sessions: newSessions };
    }),

  updateMessage: (sessionId, messageId, updates) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session) return {};
      
      const messageIndex = session.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return {};
      
      const updatedMessages = [...session.messages];
      updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updates };
      
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages: updatedMessages
          }
        }
      };
    }),

  deleteMessage: (sessionId, messageId) =>
    set(state => {
      const session = state.sessions[sessionId];
      if (!session) return {};
      
      const updatedMessages = session.messages.filter(m => m.id !== messageId);
      
      // Don't allow deleting all messages (keep at least one)
      if (updatedMessages.length === 0) return {};
      
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            messages: updatedMessages
          }
        }
      };
    }),
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
