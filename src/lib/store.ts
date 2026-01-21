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
    subscribeToUser: (uid: string) => void;
}

export const useAppStore = create<AppState>((set) => {
    let unsubscribe: (() => void) | null = null;

    return {
        user: null,
        isLoading: true,
        isAdmin: false,

        login: (user) => {
            // Initial set
            set({ user, isAdmin: user.role === 'admin', isLoading: false });
            // Setup listener
            if (unsubscribe) unsubscribe();
            unsubscribe = GymService.subscribeToUserProfile(user.uid, (updatedUser) => {
                set({ user: updatedUser, isAdmin: updatedUser.role === 'admin' });
            }) || null;
        },
        setUser: (user) => set({ user }),
        logout: () => {
            if (unsubscribe) unsubscribe();
            unsubscribe = null;
            GymService.logout();
            set({ user: null, isAdmin: false });
        },
        setLoading: (isLoading) => set({ isLoading }),
        subscribeToUser: (uid) => {
            if (unsubscribe) unsubscribe();
            unsubscribe = GymService.subscribeToUserProfile(uid, (updatedUser) => {
                set({ user: updatedUser, isAdmin: updatedUser.role === 'admin', isLoading: false });
            }) || null;
        }
    };
});
