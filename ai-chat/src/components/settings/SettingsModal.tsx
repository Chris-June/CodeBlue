import React from 'react';
import { useUiStore } from '@/stores/uiStore';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import GptCreatorForm from '../gpt/GptCreatorForm';
import AccountSettings from './AccountSettings';


const SettingsModal: React.FC = () => {
    const {
    isSettingsModalOpen,
    toggleSettingsModal,
    theme,
    setTheme,
    fonts,
    activeFont,
    setActiveFont
  } = useUiStore();


    const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', checked);
  };



  return (
    <Dialog open={isSettingsModalOpen} onOpenChange={toggleSettingsModal}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your experience, manage GPTs, and set your preferences.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="gpt-creator">GPT Creator</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode-switch">Dark Mode</Label>
                <Switch
                  id="dark-mode-switch"
                  checked={theme === 'dark'}
                  onCheckedChange={handleThemeChange}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <Label htmlFor="font-select">Font Style</Label>
                <Select value={activeFont} onValueChange={setActiveFont}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fonts.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="gpt-creator">
            <div className="p-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
              <GptCreatorForm onFinished={toggleSettingsModal} />
            </div>
          </TabsContent>
          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
