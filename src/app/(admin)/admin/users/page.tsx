'use client';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import Input from '@/components/ui/Input';

// Mock Data
const MOCK_USERS = [
    { id: 1, name: 'Sarah Connor', email: 'sarah@example.com', plan: 'ELITE', status: 'ACTIVO', expiry: '2024-12-01' },
    { id: 2, name: 'John Wick', email: 'john@example.com', plan: 'BÁSICO', status: 'ACTIVO', expiry: '2024-11-15' },
    { id: 3, name: 'Peter Parker', email: 'spidey@example.com', plan: '-', status: 'INACTIVO', expiry: '-' },
];

export default function AdminUsersPage() {
    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    GESTIÓN DE <span className="text-brand-green">USUARIOS</span>
                </h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <Input placeholder="Buscar usuario..." className="pl-10 py-2 w-64" />
                    </div>
                    <Button variant="outline">FILTROS</Button>
                </div>
            </div>

            <div className="bg-neutral-900 border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black text-gray-400 font-display italic text-sm uppercase">
                        <tr>
                            <th className="p-4 font-normal">Usuario</th>
                            <th className="p-4 font-normal">Plan</th>
                            <th className="p-4 font-normal">Estado</th>
                            <th className="p-4 font-normal">Vencimiento</th>
                            <th className="p-4 font-normal text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                        {MOCK_USERS.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div className="font-bold text-white">{u.name}</div>
                                    <div className="text-gray-500">{u.email}</div>
                                </td>
                                <td className="p-4 text-gray-300 font-mono">{u.plan}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'ACTIVO' ? 'bg-green-900/30 text-brand-green' : 'bg-red-900/30 text-red-500'}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400">{u.expiry}</td>
                                <td className="p-4 text-right">
                                    <button className="text-brand-green hover:underline text-xs mr-3">EDITAR</button>
                                    <button className="text-red-500 hover:underline text-xs">ELIMINAR</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
