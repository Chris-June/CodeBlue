import React, { useState, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useGptsStore } from '@/stores/gptsStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, RotateCw } from 'lucide-react';
import MarkdownToolbar from '../chat/MarkdownToolbar';
import { cn } from '@/lib/utils';

const MAX_MESSAGE_LENGTH = 8000;

const ComposerBar: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { activeGptId } = useGptsStore();
  const { sendMessage, isGenerating, stopGenerating } = useChatStore();

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !activeGptId || isSending) return;

    const messageContent = inputValue;
    setInputValue('');
    setIsSending(true);
    
    try {
      await sendMessage(messageContent);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, activeGptId, isSending, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsertMarkdown = (markdown: string) => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputValue.substring(start, end);
    let newValue = inputValue;
    let newCursorPos = start + markdown.length;
    
    if (selectedText) {
      // Replace selected text with markdown
      newValue = 
        inputValue.substring(0, start) +
        markdown.replace('text', selectedText) +
        inputValue.substring(end);
      newCursorPos = end + markdown.length - 4; // Adjust for 'text' replacement
    } else {
      // Insert at cursor position
      newValue = 
        inputValue.substring(0, start) +
        markdown +
        inputValue.substring(end);
    }
    
    setInputValue(newValue);
    
    // Set cursor position after the inserted markdown
    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
        textarea.focus();
      }
    }, 0);
  };
  
  const handleClearInput = () => {
    setInputValue('');
    inputRef.current?.focus();
  };
  
  const handleStopGenerating = () => {
    stopGenerating();
  };

  const charsRemaining = MAX_MESSAGE_LENGTH - inputValue.length;
  const isOverLimit = charsRemaining < 0;
  const isNearLimit = charsRemaining < 100 && !isOverLimit;
  const isSendDisabled = !inputValue.trim() || !activeGptId || isSending || isOverLimit;

  return (
    <div className="border-t bg-background">
      <MarkdownToolbar 
        onInsert={handleInsertMarkdown} 
        isDisabled={isSending || !activeGptId}
      />
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={!activeGptId ? 'Select a GPT to start chatting...' : 'Type your message here...'}
            className={cn(
              'min-h-[60px] max-h-[200px] w-full resize-none border-0 p-3 pr-24 focus-visible:ring-0 focus-visible:ring-offset-0',
              isOverLimit && 'border-red-500/50 focus-visible:ring-red-500/20',
              'transition-colors duration-200',
              'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent',
              'focus:outline-none focus:ring-0',
              'disabled:opacity-70 disabled:cursor-not-allowed'
            )}
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={!activeGptId || isSending}
          />
          {!inputValue && (
            <div className="absolute bottom-3 left-3 text-sm text-muted-foreground pointer-events-none">
              {!activeGptId ? 'Select a GPT to start chatting...' : 'Type a message...'}
            </div>
          )}
        </div>
        
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleClearInput}
              aria-label="Clear message"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-1">
            <span 
              className={cn(
                'text-xs px-2 py-1 rounded-full transition-colors',
                isOverLimit 
                  ? 'text-red-500 bg-red-500/10' 
                  : isNearLimit 
                    ? 'text-amber-500 bg-amber-500/10' 
                    : 'text-muted-foreground',
                'font-mono font-medium'
              )}
            >
              {Math.max(0, charsRemaining)}
            </span>
            {isOverLimit && (
              <span className="text-xs text-red-500">
                Message too long
              </span>
            )}
          </div>
          
          {isGenerating ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={handleStopGenerating}
              aria-label="Stop generating"
            >
              <div className="h-4 w-4 border-2 border-current rounded-full border-t-transparent animate-spin" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              size="icon" 
              className="h-8 w-8"
              disabled={isSendDisabled || isOverLimit}
              aria-label="Send message"
            >
              {isSending ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ComposerBar;
