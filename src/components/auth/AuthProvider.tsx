'use client';
import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useAppStore } from '@/lib/store';
import { GymService } from '@/lib/firebase'; // Ensure firebase is initialized via side-effect


export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { login, logout, setLoading } = useAppStore();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch full profile
                    const profile = await GymService.getUserProfile(firebaseUser.uid);
                    if (profile) {
                        login(profile);
                    } else {
                        // User exists in Auth but no profile? Rare edge case.
                        // Could create basic profile or logout.
                        console.error('No profile found for user');
                        logout();
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    logout();
                }
            } else {
                logout();
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [login, logout, setLoading]);

    return <>{children}</>;
}
