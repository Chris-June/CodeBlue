import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import HistoryList from './HistoryList';
import GptList from './GptList';
import SettingsPanel from './SettingsPanel';
import { Button } from '@/components/ui/button';

const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useUiStore();

  return (
    <motion.aside
      animate={{ width: isSidebarOpen ? 256 : 64 }}
      initial={false}
      className="flex flex-col relative border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <Button
        onClick={toggleSidebar}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full p-0',
          isSidebarOpen ? 'left-[244px]' : 'left-[52px]'
        )}
        variant="secondary"
        aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform', { 'rotate-180': !isSidebarOpen })} />
      </Button>
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
                <h1
          className={cn('text-2xl font-bold transition-opacity',
            { 'opacity-0': !isSidebarOpen }
          )}>
          IntelliSync
        </h1>
        <div className="flex-1">
          <GptList isSidebarOpen={isSidebarOpen} />
          <HistoryList isSidebarOpen={isSidebarOpen} />
        </div>
        <SettingsPanel isSidebarOpen={isSidebarOpen} />
      </div>
    </motion.aside>
  );
};

export default Sidebar;
