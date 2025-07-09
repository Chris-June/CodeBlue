import React from 'react';
import MessageList from './MessageList';
import ComposerBar from './ComposerBar';
import TypingIndicator from './TypingIndicator';

const ChatShell: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <MessageList />
      <TypingIndicator />
      <ComposerBar />
    </div>
  );
};

export default ChatShell;
