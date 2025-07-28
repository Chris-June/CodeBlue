import React, { useState, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useGptsStore } from '@/stores/gptsStore';
import { useUiStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MarkdownToolbar from '../chat/MarkdownToolbar';
import CharacterCount from '../chat/composer/CharacterCount';
import ComposerActions from '../chat/composer/ComposerActions';
import { cn } from '@/lib/utils';

const MAX_MESSAGE_LENGTH = 8000;

const ComposerBar: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { activeGptId, gpts } = useGptsStore();
  const { isWebSearchEnabled, toggleWebSearch } = useUiStore();
  const { sendMessage, isGenerating, stopGenerating } = useChatStore();
  const activeGpt = gpts.find(g => g.id === activeGptId);

  const handleInsertMarkdown = useCallback((markdown: string) => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputValue.substring(start, end);
    let newValue = inputValue;
    let newCursorPos = start + markdown.length;

    if (selectedText) {
      newValue =
        inputValue.substring(0, start) +
        markdown.replace('text', selectedText) +
        inputValue.substring(end);
      newCursorPos = end + markdown.length - 4; // Adjust for 'text' replacement
    } else {
      newValue =
        inputValue.substring(0, start) +
        markdown +
        inputValue.substring(end);
    }

    setInputValue(newValue);

    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
        textarea.focus();
      }
    }, 0);
  }, [inputValue, setInputValue, inputRef]);

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

  const handleClearInput = () => {
    setInputValue('');
    inputRef.current?.focus();
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
      <form onSubmit={handleSubmit} className="p-3">
        <div className="relative rounded-lg border-2 border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="absolute bottom-2 left-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8',
                      isWebSearchEnabled
                        ? 'text-green-500 hover:text-green-600'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={toggleWebSearch}
                    aria-label="Toggle web search"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isWebSearchEnabled ? 'Disable' : 'Enable'} Web Search</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Chat with ${activeGpt?.name || 'your GPT'}...`}
            className={cn(
              'w-full resize-none border-0 bg-transparent shadow-sm',
              'min-h-[60px] p-3 pl-12 pr-28',
              'focus-visible:ring-0 focus-visible:ring-offset-0'
            )}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={!activeGptId || isSending}
          />
          <div className="absolute bottom-2 right-14 pointer-events-none">
            <CharacterCount 
              remaining={charsRemaining} 
              isOverLimit={isOverLimit} 
              isNearLimit={isNearLimit} 
            />
          </div>
          <div className="absolute bottom-2 right-2">
            <ComposerActions 
              inputValue={inputValue}
              isGenerating={isGenerating} 
              isSending={isSending} 
              isSendDisabled={isSendDisabled}
              onClearInput={handleClearInput}
              onStopGenerating={stopGenerating} 
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComposerBar;
