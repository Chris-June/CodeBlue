import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  apiKey: string | null;
  avatar: string | null;
  setApiKey: (apiKey: string | null) => void;
  setAvatar: (avatar: string | null) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
            apiKey: null,
      avatar: null,
      setApiKey: (apiKey) => set({ apiKey }),
      setAvatar: (avatar) => set({ avatar }),
    }),
    {
      name: 'user-settings-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);
