'use client';
import { useEffect, useState } from 'react';
import StatsCard from '@/components/admin/StatsCard';
import { Users, Activity, TrendingUp } from 'lucide-react';
import { GymService } from '@/lib/firebase';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ activeUsers: 0, dailyVisits: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const data = await GymService.getDashboardStats();
            setStats(data);
            setLoading(false);
        };
        fetchStats();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-display font-bold italic text-white mb-8">
                DASHBOARD <span className="text-brand-green">GENERAL</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Usuarios Activos (Real)"
                    value={loading ? "..." : stats.activeUsers.toString()}
                    icon={Users}
                    trend="Actualizado"
                    trendUp={true}
                />
                <StatsCard
                    title="Asistencias Hoy"
                    value={loading ? "..." : stats.dailyVisits.toString()}
                    icon={Activity}
                    trend={new Date().toLocaleDateString()}
                    trendUp={true}
                />
                <StatsCard
                    title="Tasa Retención"
                    value="100%"
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity Mock */}
                <div className="bg-neutral-900 border border-gray-800 p-6">
                    <h3 className="font-display italic text-lg text-white mb-4">Actividad Reciente</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between border-b border-gray-800 pb-2">
                                <div>
                                    <p className="text-gray-300 text-sm">Nuevo pago recibido - Plan Elite</p>
                                    <p className="text-xs text-gray-500">Hace {i * 10} minutos</p>
                                </div>
                                <span className="text-brand-green font-mono text-xs">Verify</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-neutral-900 border border-gray-800 p-6">
                    <h3 className="font-display italic text-lg text-white mb-4">Estado del Sistema</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Base de Datos</span>
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">API Gateway</span>
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
