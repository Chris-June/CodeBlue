import React, { useState, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useGptsStore } from '@/stores/gptsStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

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
    <div className={`p-4 ${isFocused ? 'pb-2' : 'pb-4'} transition-all duration-300`}>
      <form 
        onSubmit={handleSubmit} 
        className={`flex items-start gap-4 p-2 bg-white/85 rounded-2xl shadow-xl transition-all duration-300 ring-2 ${isFocused ? 'ring-intellisync-blue' : 'ring-transparent'}`}>
        <Textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your message here..."
          className="flex-1 resize-none bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none ring-0 border-0 focus:ring-0 focus:border-0 p-2"
          rows={1}
          onKeyDown={handleKeyDown}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!inputValue.trim() || !activeGptId}
          className="bg-intellisync-blue hover:bg-intellisync-blue/90 text-white rounded-lg transition-all duration-300 disabled:bg-slate-300 disabled:text-slate-500"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ComposerBar;
