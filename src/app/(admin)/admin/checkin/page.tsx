'use client';
import { useState } from 'react';
import { GymService } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminCheckInPage() {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkInStatus, setCheckInStatus] = useState<{ uid: string, success: boolean, msg: string } | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setCheckInStatus(null);
        try {
            const results = await GymService.searchUsers(query);
            setUsers(results);
            if (results.length === 0) setCheckInStatus({ uid: '', success: false, msg: 'No se encontraron usuarios.' });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (user: UserProfile) => {
        if (user.membershipStatus !== 'active') return;

        try {
            await GymService.checkInUser(user.uid);
            setCheckInStatus({ uid: user.uid, success: true, msg: 'Asistencia Registrada' });
            // Optimistic update
            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, lastVisit: Date.now(), totalVisits: (u.totalVisits || 0) + 1 } : u));
        } catch (error) {
            setCheckInStatus({ uid: user.uid, success: false, msg: 'Error al registrar' });
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-display font-bold italic text-white mb-8">
                REGISTRO DE <span className="text-brand-green">ASISTENCIA</span>
            </h1>

            <Card className="mb-8">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-grow">
                        <Input
                            label="Buscar Atleta"
                            placeholder="Nombre, Email o Cédula..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col justify-end">
                        <Button type="submit" size="lg" disabled={loading}>
                            <Search className="mr-2" /> {loading ? "Buscando..." : "BUSCAR"}
                        </Button>
                    </div>
                </form>
            </Card>

            {checkInStatus && checkInStatus.uid === '' && (
                <div className="mb-8 p-4 bg-yellow-900/30 border border-yellow-700 text-yellow-500 rounded text-center">
                    {checkInStatus.msg}
                </div>
            )}

            <div className="space-y-4">
                {users.map(user => {
                    const isMembershipActive = user.membershipStatus === 'active' && user.membershipExpiry && user.membershipExpiry > Date.now();
                    const statusColor = isMembershipActive ? "text-green-500" : "text-red-500";

                    return (
                        <Card key={user.uid} className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-neutral-800 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-700">
                                    {user.photoUrl ? (
                                        <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
                                            {user.fullName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{user.fullName}</h3>
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                    <p className="text-xs text-gray-500">Cédula: {user.cedula || 'N/A'}</p>

                                    <div className="mt-2 text-sm">
                                        Estado: <span className={`font-bold uppercase ${statusColor}`}>{isMembershipActive ? 'ACTIVO' : 'INACTIVO / VENCIDO'}</span>
                                        {user.membershipExpiry && (
                                            <span className="text-gray-500 ml-2 text-xs">
                                                (Vence: {format(user.membershipExpiry, "dd MMM yyyy", { locale: es })})
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Visitas Totales: <span className="text-brand-green">{user.totalVisits || 0}</span> |
                                        Última: {user.lastVisit ? format(user.lastVisit, "dd/MM/yy HH:mm") : 'Nueva inscripción'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 min-w-[150px]">
                                {isMembershipActive ? (
                                    <Button
                                        onClick={() => handleCheckIn(user)}
                                        className="w-full bg-brand-green hover:bg-green-400 text-black border-none"
                                        disabled={checkInStatus?.uid === user.uid && checkInStatus.success}
                                    >
                                        <CheckCircle className="mr-2" />
                                        {checkInStatus?.uid === user.uid && checkInStatus.success ? "REGISTRADO" : "CHECK-IN"}
                                    </Button>
                                ) : (
                                    <div className="w-full p-2 bg-red-900/20 border border-red-800 text-red-500 rounded text-center text-sm font-bold flex items-center justify-center gap-2">
                                        <XCircle size={16} /> ACCESO DENEGADO
                                    </div>
                                )}

                                {checkInStatus?.uid === user.uid && (
                                    <span className={`text-xs ${checkInStatus.success ? 'text-green-500' : 'text-red-500'} font-bold animate-pulse`}>
                                        {checkInStatus.msg}
                                    </span>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
