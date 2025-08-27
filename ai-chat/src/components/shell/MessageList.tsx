import React, { useRef, useEffect, useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/stores/chatStore';
import { useGptsStore } from '@/stores/gptsStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import Welcome from './Welcome';
import { Lightbulb } from 'lucide-react';
import ChatBubble from './ChatBubble';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_GPT_NAME } from '@/config/branding';

/**
 * MessageList
 * Renders the chat transcript for the active session. Uses `ChatBubble` for each
 * message to guarantee cohesive visual styling across roles and keep this file
 * lean. Also keeps scroll pinned to bottom and renders assistant smart prompts.
 */
const MessageList: React.FC = () => {
  const { sessions, activeSessionId, sendMessage } = useChatStore();
  const { gpts, activeGptId } = useGptsStore();
  const { avatar } = useUserStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = activeSessionId ? sessions[activeSessionId] : null;
  const messages = useMemo(() => activeSession?.messages || [], [activeSession]);
  const activeGpt = gpts.find((g) => g.id === activeGptId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="relative flex-1 overflow-y-auto p-4 scroll-smooth" ref={scrollRef}>
      {messages.length === 0 ? (
        <Welcome />
      ) : (
        <div className="flex flex-col gap-6 px-2">
          {messages.map((message: Message, index) => (
            <div
              key={message.id}
              className={cn(
                index === messages.length - 1 ? 'animate-in fade-in slide-in-from-bottom-2' : ''
              )}
            >
              <ChatBubble
                role={message.role}
                // Use branded name for default GPT to avoid stale persisted labels (e.g., "IS-2463")
                displayName={
                  message.role !== 'user'
                    ? (activeGpt?.id === 'gpt-default' ? DEFAULT_GPT_NAME : activeGpt?.name)
                    : undefined
                }
                content={message.content}
                avatar={message.role === 'user' ? avatar : activeGpt?.avatar}
              />

              {/* Assistant smart prompts */}
              {message.role === 'assistant' && message.smartPrompts && message.smartPrompts.length > 0 && (
                <Card
                  variant="purple"
                  className="mt-5 pl-1 relative overflow-hidden"
                >
                  {/* Prominent purple TOP STRIP with steep fade */}
                  <div className="pointer-events-none absolute top-0 left-0 right-0 z-0 h-24 sm:h-28 bg-gradient-to-b from-purple-800/90 via-purple-300/50 to-transparent" />
                  <CardContent className="relative z-10 pt-4 pb-4">
                    <p className="text-xs font-medium text-foreground mb-3 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-blue-800" />
                      Want to dive deeper?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {message.smartPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => sendMessage(prompt)}
                          className="group w-full text-left p-3.5 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-7 h-7 rounded-full bg-amber-400/15 flex items-center justify-center group-hover:bg-amber-400/25 transition-colors">
                                <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
                              </div>
                            </div>
                            <span className="text-sm text-foreground/90 leading-snug group-hover:text-foreground transition-colors">
                              {prompt}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageList;
