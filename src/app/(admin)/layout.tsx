'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            // If not logged in or not admin, kick them out
            if (!user || user.role !== 'admin') {
                router.replace('/dashboard');
            }
        }
    }, [user, isLoading, router]);

    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-brand-green font-mono">VERIFICANDO CREDENCIALES...</div>;

    // Render nothing while redirecting
    if (!user || user.role !== 'admin') return null;

    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    );
}
