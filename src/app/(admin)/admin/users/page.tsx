'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import Input from '@/components/ui/Input';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        GymService.getUsers().then(setUsers);
    }, []);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
            u.cedula?.includes(search) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' ? true : u.membershipStatus === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    GESTIÓN DE <span className="text-brand-green">USUARIOS</span>
                </h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <Input
                            placeholder="Buscar por Nombre, Cédula..."
                            className="pl-10 py-2 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-800 pb-2">
                {['all', 'active', 'inactive'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`text-sm font-bold uppercase pb-2 px-2 transition-colors ${filter === f ? 'text-brand-green border-b-2 border-brand-green' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {f === 'all' ? 'TODOS' : f}
                    </button>
                ))}
            </div>

            <div className="bg-neutral-900 border border-gray-800 overflow-hidden rounded-lg">
                <table className="w-full text-left">
                    <thead className="bg-black text-gray-400 font-display italic text-sm uppercase">
                        <tr>
                            <th className="p-4 font-normal">Atleta</th>
                            <th className="p-4 font-normal">ID / Contacto</th>
                            <th className="p-4 font-normal">Estado</th>
                            <th className="p-4 font-normal">Vencimiento</th>
                            <th className="p-4 font-normal text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                        {filteredUsers.map(u => (
                            <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div className="font-bold text-white uppercase">{u.fullName}</div>
                                    <div className="text-gray-500 text-xs">{u.email}</div>
                                </td>
                                <td className="p-4 text-gray-300">
                                    <div className="font-mono text-xs text-brand-green">{u.cedula || 'S/N'}</div>
                                    <div className="text-gray-500 text-xs">{u.phone || '-'}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.membershipStatus === 'active' ? 'bg-green-900/30 text-brand-green' : 'bg-red-900/30 text-red-500'}`}>
                                        {u.membershipStatus}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 font-mono">
                                    {u.membershipExpiry ? new Date(u.membershipExpiry).toLocaleDateString() : '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-brand-green hover:underline text-xs">EDITAR</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
