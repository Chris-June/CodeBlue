import React from 'react';
import { useUiStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings } from 'lucide-react';

interface SettingsPanelProps {
  isSidebarOpen: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isSidebarOpen }) => {
  const { toggleSettingsModal } = useUiStore();

  if (!isSidebarOpen) {
    return (
      <div className="flex flex-col items-center gap-2 mt-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open settings" onClick={toggleSettingsModal} className="text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-auto">
      <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={toggleSettingsModal}>
        <Settings className="mr-2 h-5 w-5" />
        Settings
      </Button>
    </div>
  );
};

export default SettingsPanel;
