import React, { useState, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useGptsStore } from '@/stores/gptsStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

const ComposerBar: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
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
    <form onSubmit={handleSubmit} className="flex items-start gap-2 p-4 border-t">
      <Textarea
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message here..."
        className="flex-1 resize-none"
        rows={1}
        onKeyDown={handleKeyDown}
      />
      <Button type="submit" size="icon" disabled={!inputValue.trim() || !activeGptId}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ComposerBar;
