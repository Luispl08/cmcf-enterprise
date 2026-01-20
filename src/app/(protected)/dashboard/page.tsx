'use client';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function DashboardPage() {
    const { user } = useAppStore();

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-display italic text-white mb-8">
                HOLA, <span className="text-brand-green uppercase">{user?.fullName}</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Estado de Membresía">
                    <div className="text-brand-green text-2xl font-bold uppercase mb-2">
                        {user?.membershipStatus === 'active' ? 'ACTIVA' : 'INACTIVA'}
                    </div>
                    <p className="text-sm">Vence: {user?.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString() : 'N/A'}</p>
                    <Button variant="outline" className="mt-4 w-full text-xs">RENOVAR</Button>
                </Card>

                <Card title="Próxima Clase">
                    <p className="text-gray-400">No hay clases reservadas.</p>
                    <Button variant="outline" className="mt-4 w-full text-xs">VER HORARIOS</Button>
                </Card>

                <Card title="Estadísticas">
                    <div className="flex justify-between items-center mb-2">
                        <span>Asistencias mes:</span>
                        <span className="text-white font-bold">12</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full w-[60%]"></div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
