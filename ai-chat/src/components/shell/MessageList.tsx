import React, { useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { useGptsStore } from '@/stores/gptsStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import Welcome from './Welcome';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MessageList: React.FC = () => {
  const { sessions, activeSessionId, sendMessage } = useChatStore();
    const { gpts, activeGptId } = useGptsStore();
  const { avatar } = useUserStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = activeSessionId ? sessions[activeSessionId] : null;
  const messages = activeSession?.messages || [];
  const activeGpt = gpts.find((g) => g.id === activeGptId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="relative flex-1 overflow-y-auto p-4" ref={scrollRef}>
      {messages.length === 0 ? (
        <Welcome />
      ) : (
        <div className="flex flex-col gap-4">
        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={cn(
              'flex items-start gap-3 text-sm z-10',
              message.role === 'user' && 'justify-end'
            )}
          >
            {message.role === 'assistant' && (
              <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold">
                {activeGpt?.avatar || '🤖'}
              </span>
            )}
            <div
              className={cn(
                'max-w-[75%] space-y-1',
                message.role === 'user' && 'text-right'
              )}
            >
              {message.role !== 'user' && (
                <p className="font-semibold">
                  {activeGpt?.name}
                </p>
              )}
              <div
                className={cn(
                  'p-3 rounded-xl inline-block',
                  message.role === 'user'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-muted'
                )}
              >
                <article
                  className={cn(
                    'prose prose-sm max-w-full text-left',
                    message.role === 'user'
                      ? 'prose-invert' // White text on dark background
                      : 'dark:prose-invert' // Default prose (dark text), inverted for dark mode
                  )}
                >
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </article>
              </div>
              {message.role === 'assistant' && message.smartPrompts && message.smartPrompts.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm font-semibold mb-2">Want to dive deeper?</p>
                  <div className="flex flex-wrap gap-2">
                    {message.smartPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(prompt)}
                        className="text-xs h-auto py-1 px-2"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {message.role === 'user' && (
                            <Avatar className="w-8 h-8">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback>Me</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default MessageList;
