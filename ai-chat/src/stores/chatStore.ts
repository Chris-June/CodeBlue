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
  isGenerating: boolean;
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
    const { setLoading } = get();

    if (!activeGptId) {
      console.error('No active GPT selected');
      return;
    }
    
    const activeGpt = gpts.find(gpt => gpt.id === activeGptId);
    if (!activeGpt) {
      console.error('Active GPT not found');
      return;
    }
    
    // Create a new AbortController for this request
    const abortController = new AbortController();
    set({ isGenerating: true, abortController });

    let sessionId = get().activeSessionId;

    // Step 1: Atomically update state to create session (if needed) and add user message.
    set(state => {
      let newSessions = { ...state.sessions };
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

      const { isWebSearchEnabled } = useUiStore.getState();
      const tools = isWebSearchEnabled ? [{ type: 'web_search_preview' }] : [];

      const currentMessages = get().sessions[currentSessionId].messages;

      const body = JSON.stringify({
        model: activeGpt.model || 'gpt-4o',
        messages: currentMessages.slice(0, -1).map(({ id, smartPrompts, ...rest }) => rest), // Exclude placeholder
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
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) throw new Error(`API error: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const annotationsDelimiter = '||ANNOTATIONS||';
      const promptsDelimiter = '||SMART_PROMPTS||';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
      }

      let mainContent = buffer;
      let annotationsJson = '';
      let promptsJson = '';

      // Use split for robust parsing, regardless of order.
      const promptsParts = mainContent.split(promptsDelimiter);
      if (promptsParts.length > 1) {
        mainContent = promptsParts[0];
        promptsJson = promptsParts[1];
      }

      const annotationsParts = mainContent.split(annotationsDelimiter);
      if (annotationsParts.length > 1) {
        mainContent = annotationsParts[0];
        annotationsJson = annotationsParts[1];
      }

      set(state => {
        const session = state.sessions[currentSessionId];
        if (!session || session.messages.length === 0) return {};
        const lastMessage = session.messages[session.messages.length - 1];
        const updatedLastMessage = { ...lastMessage, content: mainContent };
        const updatedMessages = [...session.messages.slice(0, -1), updatedLastMessage];
        return {
          sessions: { 
            ...state.sessions, 
            [currentSessionId]: { ...session, messages: updatedMessages }
          }
        };
      });

      if (annotationsJson) {
        try {
          get().addAnnotations(currentSessionId, JSON.parse(annotationsJson));
        } catch (e) { console.error('Failed to parse annotations JSON:', e); }
      }
      if (promptsJson) {
        try {
          get().addSmartPrompts(currentSessionId, JSON.parse(promptsJson));
        } catch (e) { console.error('Failed to parse smart prompts JSON:', e); }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted by user');
      } else {
        console.error('Failed to fetch streaming response:', error);
        get().setError(currentSessionId, 'Failed to get a response from the assistant.');
      }
    } finally {
      setLoading(currentSessionId, false);
      set({ isGenerating: false, abortController: null });
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
    set(state => {
      const sessions = { ...state.sessions };
      delete sessions[sessionId];
      
      // If we deleted the active session, set active to another session or null
      let activeSessionId = state.activeSessionId;
      if (sessionId === activeSessionId) {
        const remainingSessionIds = Object.keys(sessions);
        activeSessionId = remainingSessionIds.length > 0 ? remainingSessionIds[0] : null;
      }
      
      return { sessions, activeSessionId };
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
