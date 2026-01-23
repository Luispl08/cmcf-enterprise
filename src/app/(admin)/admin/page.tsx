'use client';
import { useEffect, useState } from 'react';
import StatsCard from '@/components/admin/StatsCard';
import { Users, Activity, TrendingUp } from 'lucide-react';
import { GymService } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ activeUsers: 0, dailyVisits: 0 });
    const [recentActivity, setRecentActivity] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const statsData = await GymService.getDashboardStats();
            const activityData = await GymService.getRecentCheckins(5);
            setStats(statsData);
            setRecentActivity(activityData);
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-display font-bold italic text-white mb-8">
                DASHBOARD <span className="text-brand-green">GENERAL</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity Feed */}
                <div className="bg-neutral-900 border border-gray-800 p-6">
                    <h3 className="font-display italic text-lg text-white mb-4">Actividad Reciente</h3>
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-gray-500 text-sm">Cargando...</p>
                        ) : recentActivity.length === 0 ? (
                            <p className="text-gray-500 text-sm">No hay actividad reciente.</p>
                        ) : (
                            recentActivity.map(user => (
                                <div key={user.uid} className="flex items-center justify-between border-b border-gray-800 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                                            {user.photoUrl ? (
                                                <img src={user.photoUrl} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                                    {user.fullName.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-gray-300 text-sm font-bold">{user.fullName}</p>
                                            <p className="text-xs text-gray-500">
                                                Hace {user.lastVisit ? formatDistanceToNow(user.lastVisit, { locale: es }) : 'un momento'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-brand-green font-mono text-xs px-2 py-1 bg-brand-green/10 rounded">CHECK-IN</span>
                                </div>
                            ))
                        )}
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
