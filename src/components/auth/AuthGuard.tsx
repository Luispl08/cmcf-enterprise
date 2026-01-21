'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
        // Ensure real-time subscription is active
        if (user) {
            useAppStore.getState().subscribeToUser(user.uid);
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-brand-green font-display italic animate-pulse">
                CARGANDO...
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
