import React, { useState, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useGptsStore } from '@/stores/gptsStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

/**
 * ComposerBar
 * Compact message composer with a single-line growing textarea and a send button.
 * - Vertically centers the send button relative to the input.
 * - Ensures the send icon remains visible even when the button is disabled.
 */
const ComposerBar: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { activeGptId } = useGptsStore();
  const { sendMessage } = useChatStore();

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeGptId) return;

    const messageContent = inputValue;
    setInputValue('');
    await sendMessage(messageContent);
    inputRef.current?.focus();
  };

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

  return (
    <div className={`px-3 py-2 ${isFocused ? 'pb-1.5' : 'pb-2.5'} transition-all duration-300`}>
      <form 
        onSubmit={handleSubmit} 
        className={`flex items-center gap-2 p-1.5 bg-white/85 rounded-xl shadow-xl transition-all duration-300 ring-2 ${isFocused ? 'ring-intellisync-blue' : 'ring-transparent'}`}>
        <Textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your message here..."
          className="flex-1 resize-none bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none ring-0 border-0 focus:ring-0 focus:border-0 p-1 text-sm leading-tight min-h-0"
          rows={1}
          onKeyDown={handleKeyDown}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!inputValue.trim() || !activeGptId}
          aria-label="Send message"
          title="Send"
          className="self-center shrink-0 bg-intellisync-blue hover:bg-intellisync-blue/90 text-white rounded-md transition-all duration-300 disabled:opacity-100 disabled:bg-intellisync-blue/40 disabled:text-white/80 h-8 w-8 p-0"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
};

export default ComposerBar;
