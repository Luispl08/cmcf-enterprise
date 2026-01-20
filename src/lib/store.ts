import { create } from 'zustand';
import { UserProfile } from '@/types';
import { GymService } from './firebase';

interface AppState {
    user: UserProfile | null;
    isLoading: boolean;
    isAdmin: boolean;

    // Actions
    login: (u: UserProfile) => void;
    setUser: (u: UserProfile | null) => void;
    logout: () => void;
    setLoading: (l: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    isLoading: true,
    isAdmin: false,

    login: (user) => set({ user, isAdmin: user.role === 'admin', isLoading: false }),
    setUser: (user) => set({ user }), // For updates without full login logic
    logout: () => {
        GymService.logout();
        set({ user: null, isAdmin: false });
    },
    setLoading: (isLoading) => set({ isLoading })
}));
