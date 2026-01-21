'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Dumbbell, Menu, X, User } from 'lucide-react';
import { clsx } from 'clsx';

export default function Navbar() {
    const { user, logout } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-black/95 border-b border-white/10 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center group">
                    <Dumbbell className="text-brand-green h-8 w-8 group-hover:rotate-12 transition-transform" />
                    <span className="ml-2 font-display text-2xl tracking-widest text-white italic">
                        CMCF <span className="text-brand-green">FITNESS CENTER</span>
                    </span>
                </Link>

                {/* Mobile Toggle */}
                <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center space-x-6">
                    <Link href="/" className="font-display italic text-sm hover:text-brand-green">INICIO</Link>

                    {user ? (
                        <>
                            <Link href="/dashboard" className="bg-brand-green text-black px-4 py-1 font-display font-bold italic text-sm hover:bg-white transform -skew-x-12">
                                <span className="block skew-x-12">DASHBOARD</span>
                            </Link>
                            {user.role === 'admin' && (
                                <Link href="/admin" className="text-red-500 font-display italic text-sm border border-red-500 px-3 hover:bg-red-500 hover:text-white transition">
                                    ADMIN
                                </Link>
                            )}
                            <button onClick={logout} className="text-xs text-gray-500 hover:text-white font-mono uppercase">
                                Salir
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="border border-brand-green text-brand-green px-6 py-1 font-display italic text-sm hover:bg-brand-green hover:text-black transition">
                            ENTRAR
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-neutral-900 border-b border-gray-800 shadow-xl flex flex-col p-4 space-y-4 text-center animate-in slide-in-from-top-5">
                    <Link href="/" onClick={() => setIsOpen(false)} className="py-2 text-white font-display italic text-xl">INICIO</Link>
                    {user ? (
                        <>
                            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="py-2 text-brand-green font-display italic text-xl">MI DASHBOARD</Link>
                            {user.role === 'admin' && <Link href="/admin" onClick={() => setIsOpen(false)} className="py-2 text-red-500 font-display italic text-xl">ADMIN</Link>}
                            <button onClick={() => { logout(); setIsOpen(false) }} className="py-2 text-gray-500">Cerrar Sesión</button>
                        </>
                    ) : (
                        <Link href="/login" onClick={() => setIsOpen(false)} className="py-2 bg-brand-green text-black font-display font-bold italic">ENTRAR</Link>
                    )}
                </div>
            )}
        </nav>
    );
}
