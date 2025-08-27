/*
  ChatBubble.tsx
  ----------------
  UI component for rendering a single chat message with a cohesive visual style.
  This centralizes avatar, name, markdown formatting, and bubble variants so the
  rest of the app can remain minimal. Keep this file under 500 LOC.
*/

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CodeBlock from './CodeBlock';

export interface ChatBubbleProps {
  /** Message role determines alignment and styling */
  role: 'user' | 'assistant';
  /** Display name for non-user roles (e.g., the active GPT name) */
  displayName?: string;
  /** Message body as markdown string */
  content: string;
  /** Avatar emoji/url or fallback text */
  avatar?: string | null;
}

/**
 * ChatBubble
 * Single responsibility component for a message row.
 * - Aligns to start/end based on `role`
 * - Renders avatar on the correct side
 * - Applies consistent bubble tokens: padding, radius, shadows, borders
 */
const ChatBubble: React.FC<ChatBubbleProps> = ({ role, displayName, content, avatar }) => {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'group flex items-start gap-4 text-sm z-10 transition-all duration-200',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Assistant avatar on the left */}
      {!isUser && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center border border-border shadow-sm">
          <span className="text-2xl">{avatar || '🤖'}</span>
        </div>
      )}

      <div className={cn('max-w-[85%] md:max-w-[75%] space-y-1.5', isUser && 'text-right')}>
        {/* Label for assistant */}
        {!isUser && displayName && (
          <p className="text-xs font-medium text-muted-foreground mb-1 pl-1">{displayName}</p>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'p-4 rounded-2xl inline-block shadow-sm transition-all duration-200 overflow-hidden',
            isUser
              ? 'bg-transparent text-foreground'
              : 'bg-card bubble-gradient-purple border border-border/50 shadow-muted/20 hover:shadow-md hover:border-border'
          )}
        >
          <article
            className={cn(
              'prose prose-sm max-w-full text-left break-words prose-p:leading-relaxed dark:prose-invert'
            )}
          >
            {(() => {
              const components: Components = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code(props: any) {
                  const { inline, className, children, ...rest } = props;
                  const text = String(children ?? '');
                  if (inline) {
                    return (
                      <code {...rest} className="rounded px-1.5 py-0.5 bg-muted/50 text-foreground">
                        {text}
                      </code>
                    );
                  }
                  return <CodeBlock value={text} className={className ?? undefined} />;
                },
              };
              return (
                <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]} components={components}>
                  {content}
                </ReactMarkdown>
              );
            })()}
          </article>
        </div>
      </div>

      {/* User avatar on the right */}
      {isUser && (
        <Avatar className="w-14 h-14">
          {/* If `avatar` is an URL, AvatarImage uses it; otherwise rely on fallback */}
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className="text-base">Me</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatBubble;
