import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';
export type FontFamily = 'font-sans' | 'font-lato' | 'font-roboto' | 'font-mono';

export interface Font {
  name: string;
  value: FontFamily;
}

export const availableFonts: Font[] = [
  { name: 'Inter', value: 'font-sans' },
  { name: 'Lato', value: 'font-lato' },
  { name: 'Roboto', value: 'font-roboto' },
  { name: 'Source Code Pro', value: 'font-mono' },
];

interface UiState {
  theme: Theme;
  isSidebarOpen: boolean;
  isSettingsModalOpen: boolean;
  activeFont: FontFamily;
  fonts: Font[];
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  toggleSettingsModal: () => void;
  setActiveFont: (font: FontFamily) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      isSidebarOpen: true,
      isSettingsModalOpen: false,
      fonts: availableFonts,
      activeFont: 'font-sans', // Default to Inter
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleSettingsModal: () =>
        set((state) => ({ isSettingsModalOpen: !state.isSettingsModalOpen })),
      setActiveFont: (font) => set({ activeFont: font }),
    }),
    {
      name: 'ui-storage', // key in localStorage
    }
  )
);
