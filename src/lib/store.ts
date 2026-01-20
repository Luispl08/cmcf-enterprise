import { create } from 'zustand';
import { UserProfile } from '@/types';
import { GymService } from './firebase';

interface AppState {
    user: UserProfile | null;
    isLoading: boolean;
    isAdmin: boolean;

    // Actions
    login: (u: UserProfile) => void;
    logout: () => void;
    setLoading: (l: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    isLoading: true,
    isAdmin: false,

    login: (user) => set({ user, isAdmin: user.role === 'admin', isLoading: false }),
    logout: () => {
        GymService.logout();
        set({ user: null, isAdmin: false });
    },
    setLoading: (isLoading) => set({ isLoading })
}));
