import React, { useRef, useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { useGptsStore } from '@/stores/gptsStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { Edit, Trash2, Check, X, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Welcome from './Welcome';
import SmartPrompts from '../chat/SmartPrompts';
import TypingIndicator from './TypingIndicator';
import Citation from '@/components/chat/Citation';
import type { UrlCitation } from '@/stores/chatStore';

interface MessageItemProps {
  message: Message;
  isUser: boolean;
  gptAvatar?: string;
  userAvatar?: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

const parseCitations = (content: string, annotations: UrlCitation[] | undefined): React.ReactNode[] => {
  if (!annotations || annotations.length === 0) {
    return [content];
  }

  let lastIndex = 0;
  const nodes: React.ReactNode[] = [];

  annotations.forEach((citation, i) => {
    const placeholder = citation.text;
    const placeholderIndex = content.indexOf(placeholder, lastIndex);

    if (placeholderIndex > -1) {
      // Add text before the citation
      if (placeholderIndex > lastIndex) {
        nodes.push(content.substring(lastIndex, placeholderIndex));
      }
      // Add the citation component
      nodes.push(<Citation key={`citation-${i}`} citation={citation} index={i} />);
      lastIndex = placeholderIndex + placeholder.length;
    } else {
      // Fallback if placeholder isn't found, though it should be.
      console.warn(`Citation placeholder "${placeholder}" not found.`);
    }
  });

  // Add any remaining text after the last citation
  if (lastIndex < content.length) {
    nodes.push(content.substring(lastIndex));
  }

  return nodes;
};

const MessageItem: React.FC<MessageItemProps> = ({ message, isUser, gptAvatar, userAvatar, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit(message.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 py-3 text-sm',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
        {isUser ? (
          <>
            {userAvatar ? (
              <AvatarImage src={userAvatar} alt="User" />
            ) : (
              <AvatarFallback>{'You'}</AvatarFallback>
            )}
          </>
        ) : (
          <>
            {gptAvatar && gptAvatar.startsWith('http') ? (
              <AvatarImage src={gptAvatar} alt="GPT" />
            ) : (
              <AvatarFallback className="bg-transparent text-2xl p-0">
                {gptAvatar || '🤖'}
              </AvatarFallback>
            )}
          </>
        )}
      </Avatar>
      
      <div className={cn(
        'relative max-w-[85%] md:max-w-[75%] rounded-lg px-4 py-2',
        isUser 
          ? 'bg-primary text-primary-foreground rounded-br-none' 
          : 'bg-muted rounded-bl-none',
        'transition-colors duration-200'
      )}>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={handleTextareaChange}
              className="w-full p-2 rounded bg-background/50 text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/50"
              rows={1}
              onKeyDown={handleTextareaKeyDown}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "prose prose-sm max-w-none break-words",
            !isUser && "dark:prose-invert"
          )}>
            {message.annotations && message.annotations.length > 0 ? (
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none break-words">
                {parseCitations(message.content, message.annotations)}
              </div>
            ) : (
              <ReactMarkdown
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
                components={{
                  a: ({ ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
                  ),
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <div className="relative">
                        <pre className={cn('p-4 rounded-md overflow-x-auto bg-black/80', className)} {...props as any}>
                          <code>{children}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className={cn('bg-muted/50 px-1 py-0.5 rounded', className)} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>

      {!isEditing && (
        <div className={cn(
          'absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'left-12' : 'right-12'
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Message actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isUser ? 'end' : 'start'}>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

const MessageList: React.FC = () => {
  const { sessions, activeSessionId, updateMessage, deleteMessage } = useChatStore();
  const { gpts, activeGptId } = useGptsStore();
  const { avatar } = useUserStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = activeSessionId ? sessions[activeSessionId] : null;
  const messages = activeSession?.messages || [];
  const activeGpt = gpts.find((g) => g.id === activeSession?.gptId) || gpts.find((g) => g.id === activeGptId);
  
  const handleEditMessage = (messageId: string, content: string) => {
    if (activeSessionId) {
      updateMessage(activeSessionId, messageId, { content });
    }
  };
  
  const handleDeleteMessage = (messageId: string) => {
    if (activeSessionId) {
      deleteMessage(activeSessionId, messageId);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto" ref={scrollRef}>
        <div className={cn(
          'px-4 py-2',
          messages.length === 0 && 'h-full flex items-center justify-center'
        )}>
            {!activeSession ? (
                <Welcome />
            ) : (
                <div className="flex flex-col">
                  {messages.map((message, index) => (
                    <div key={message.id}>
                      <MessageItem
                        message={message}
                        isUser={message.role === 'user'}
                        gptAvatar={activeGpt?.avatar}
                        userAvatar={avatar || undefined}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                      />
                      {message.role === 'assistant' &&
                        message.smartPrompts &&
                        index === messages.length - 1 &&
                        !activeSession?.isLoading && (
                          <SmartPrompts prompts={message.smartPrompts} />
                      )}
                    </div>
                  ))}
                  {(() => {
                    const lastMessage = messages[messages.length - 1];
                    const showTypingIndicator = activeSession?.isLoading && lastMessage?.role === 'assistant' && lastMessage.content === '';

                    if (showTypingIndicator) {
                      return (
                        <div className="flex items-start gap-3 py-3 text-sm flex-row">
                          <Avatar className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                            {activeGpt?.avatar ? (
                              <AvatarImage src={activeGpt.avatar} alt={activeGpt.name} />
                            ) : (
                              <AvatarFallback>AI</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="relative flex items-center rounded-xl px-4 py-2 bg-muted h-10">
                            <TypingIndicator />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
            )}
        </div>
    </div>
  );
};

export default MessageList;
