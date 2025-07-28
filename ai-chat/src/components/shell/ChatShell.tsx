import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/stores/uiStore';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGptsStore } from '@/stores/gptsStore';
import { useChatStore } from '@/stores/chatStore';
import MessageList from './MessageList';
import ComposerBar from './ComposerBar';
import TypingIndicator from './TypingIndicator';
import ModelInfo from '../chat/ModelInfo';
import { cn } from '@/lib/utils';

const ChatShell: React.FC = () => {
  const { activeGptId, gpts } = useGptsStore();
  const { isGenerating } = useChatStore();
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [previousGptId, setPreviousGptId] = useState<string | null>(null);
  const [showSwitchNotification, setShowSwitchNotification] = useState(false);

  const activeGpt = gpts.find(gpt => gpt.id === activeGptId) || null;

  // Show notification when GPT changes
  useEffect(() => {
    if (activeGptId && activeGptId !== previousGptId) {
      setShowSwitchNotification(true);
      const timer = setTimeout(() => {
        setShowSwitchNotification(false);
      }, 3000);
      
      setPreviousGptId(activeGptId);
      return () => clearTimeout(timer);
    }
  }, [activeGptId]);

  // Toggle model info on hover
  const handleMouseEnter = () => setShowModelInfo(true);
  const handleMouseLeave = () => setShowModelInfo(false);

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-2 border-b">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
          </Button>
          <h2 className="text-lg font-semibold truncate">
            {activeGpt ? activeGpt.name : 'Intelli-Chat'}
          </h2>
          {/* Placeholder for potential right-side actions */}
          <div className="w-8"></div>
        </div>
      {/* Desktop Header Area */}
      <div 
        className="relative border-b p-2 h-14 hidden md:flex items-center justify-end"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Model info that shows on hover */}
        <AnimatePresence>
          {showModelInfo && activeGpt && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'absolute top-2 right-2 z-20 transition-opacity',
                'bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-lg'
              )}
            >
              <ModelInfo gpt={activeGpt} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Area */}
      <div className="relative flex-1 min-h-0">
        <MessageList />
        
        {/* Notification when switching models */}
        <AnimatePresence>
          {showSwitchNotification && activeGpt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
            >
              <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <span>Now chatting with</span>
                <span className="font-semibold">{activeGpt.name}</span>
                <span className="text-xs opacity-80">
                  ({activeGpt.model || 'gpt-4o'})
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Composer Area */}
      <TypingIndicator />
      <ComposerBar />
    </div>
    </>
  );
};

export default ChatShell;
