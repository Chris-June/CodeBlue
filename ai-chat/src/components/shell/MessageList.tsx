import React, { useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/stores/chatStore';
import { useGptsStore } from '@/stores/gptsStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import Welcome from './Welcome';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lightbulb } from 'lucide-react';

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
    <div className="relative flex-1 overflow-y-auto p-4 scroll-smooth" ref={scrollRef}>
      {messages.length === 0 ? (
        <Welcome />
      ) : (
        <div className="flex flex-col gap-6 px-2">
          {messages.map((message: Message, index) => (
            <div
              key={message.id}
              className={cn(
                'group flex items-start gap-4 text-sm z-10 transition-all duration-200',
                message.role === 'user' ? 'justify-end' : 'justify-start',
                index === messages.length - 1 ? 'animate-in fade-in slide-in-from-bottom-2' : ''
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center border border-border shadow-sm">
                  <span className="text-2xl">
                    {activeGpt?.avatar || '🤖'}
                  </span>
                </div>
              )}
              
              <div className={cn(
                'max-w-[85%] md:max-w-[75%] space-y-1.5',
                message.role === 'user' && 'text-right'
              )}>
                {message.role !== 'user' && (
                  <p className="text-sm font-medium text-muted-foreground mb-1 pl-1">
                    {activeGpt?.name}
                  </p>
                )}
                
                <div
                  className={cn(
                    'p-4 rounded-2xl inline-block shadow-sm transition-all duration-200',
                    message.role === 'user' 
                      ? 'bg-intellisync-blue text-white shadow-intellisync-blue/20' 
                      : 'bg-card border border-border/50 shadow-muted/20 hover:shadow-md hover:border-border'
                  )}
                >
                  <article
                    className={cn(
                      'prose prose-sm max-w-full text-left break-words',
                      message.role === 'user'
                        ? 'prose-invert' // White text on dark background
                        : 'prose-p:leading-relaxed dark:prose-invert' // Better line height for readability
                    )}
                  >
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw, rehypeHighlight]}
                      components={{
                        pre: ({node, ...props}) => (
                          <div className="relative">
                            <pre {...props} className="rounded-lg p-4 bg-muted/50 overflow-x-auto" />
                          </div>
                        ),
                        code: ({node, ...props}) => (
                          <code {...props} className="rounded px-1.5 py-0.5 bg-muted/50 text-foreground" />
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </article>
                </div>

                {message.role === 'assistant' && message.smartPrompts && message.smartPrompts.length > 0 && (
                  <div className="mt-5 pl-1">
                    <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-intellisync-blue" />
                      Want to dive deeper?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {message.smartPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => sendMessage(prompt)}
                          className="group w-full text-left p-3.5 rounded-xl border border-border/40 bg-muted/5 hover:bg-muted/20 transition-all duration-200 hover:shadow-sm hover:shadow-intellisync-blue/10 hover:border-intellisync-blue/30 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-7 h-7 rounded-full bg-intellisync-blue/10 flex items-center justify-center group-hover:bg-intellisync-blue/20 transition-colors">
                                <Lightbulb className="h-3.5 w-3.5 text-intellisync-blue" />
                              </div>
                            </div>
                            <span className="text-sm text-foreground/90 leading-snug group-hover:text-foreground transition-colors">
                              {prompt}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            {message.role === 'user' && (
              <Avatar className="w-14 h-14">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="text-base">Me</AvatarFallback>
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
