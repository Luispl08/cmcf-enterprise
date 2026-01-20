'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { LayoutDashboard, Users, CreditCard, Dumbbell, Settings, LogOut, DollarSign, Menu, X, ClipboardList } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Check-In', href: '/admin/checkin', icon: ClipboardList },
    { name: 'Pagos', href: '/admin/payments', icon: CreditCard },
    { name: 'Precios', href: '/admin/plans', icon: DollarSign },
    { name: 'Clases', href: '/admin/classes', icon: Dumbbell },
    { name: 'Admin', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout } = useAppStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-black">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-neutral-900 border-b border-gray-800 flex items-center justify-between px-4 z-50">
                <span className="font-display italic text-xl text-white">
                    CMCF <span className="text-brand-green">ADMIN</span>
                </span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-800 bg-neutral-900 flex flex-col transition-transform duration-300 md:translate-x-0 md:static",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center px-6 border-b border-gray-800">
                    <span className="font-display italic text-xl text-white">
                        CMCF <span className="text-brand-green">ADMIN</span>
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={clsx(
                                    "flex items-center space-x-3 px-4 py-3 rounded transition-colors group",
                                    isActive
                                        ? "bg-brand-green text-black font-bold"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5", isActive ? "text-black" : "text-gray-500 group-hover:text-white")} />
                                <span className={clsx("font-display italic tracking-wide", isActive ? "not-italic text-sm" : "text-sm")}>
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-display italic text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-noise pt-16 md:pt-0">
                {children}
            </main>
        </div>
    );
}

