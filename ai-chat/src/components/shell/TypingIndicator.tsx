import React from 'react';
import { useChatStore } from '@/stores/chatStore';


const TypingIndicator: React.FC = () => {
  const { sessions, activeSessionId } = useChatStore();
  const activeSession = activeSessionId ? sessions[activeSessionId] : null;

  if (!activeSession?.isLoading) {
    return null;
  }


  return (
    <div className="p-4 flex items-center gap-2">
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
    </div>
  );
};

export default TypingIndicator;
