'use client';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function DashboardPage() {
    const { user } = useAppStore();
    const router = useRouter();

    if (!user) return null;

    // Membership Logic
    // Membership is active if status is active AND expiry date is in the future
    const isMembershipActive = user.membershipStatus === 'active' && user.membershipExpiry && user.membershipExpiry > Date.now();
    const isPending = user.membershipStatus === 'pending';
    const hasExpired = user.membershipStatus === 'active' && user.membershipExpiry && user.membershipExpiry <= Date.now();

    const daysRemaining = user.membershipExpiry ? differenceInDays(new Date(user.membershipExpiry), new Date()) : 0;
    const isExpiringSoon = isMembershipActive && daysRemaining <= 3 && daysRemaining >= 0;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-display font-bold italic text-white mb-2">
                        HOLA, <span className="text-brand-green uppercase">{user.fullName.split(' ')[0]}</span>
                    </h1>
                    <p className="text-gray-400">Bienvenido al panel de control de atleta.</p>
                </div>

                {/* CTA Buttons based on status */}
                {(!isMembershipActive && !isPending) && (
                    <Button variant="primary" size="lg" onClick={() => router.push('/#plans')}>
                        ACTIVAR MEMBRESÍA
                    </Button>
                )}
                {isExpiringSoon && (
                    <Button variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10" onClick={() => router.push('/#plans')}>
                        RENOVAR AHORA (VENCE PRONTO)
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Membership Status Card */}
                <Card title="ESTADO DE MEMBRESÍA" className="h-full relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${isMembershipActive ? 'bg-green-900/30 text-brand-green' : isPending ? 'bg-yellow-900/30 text-yellow-500' : 'bg-red-900/30 text-red-500'}`}>
                            {isMembershipActive ? <CheckCircle /> : isPending ? <Clock /> : <AlertTriangle />}
                        </div>
                        {isMembershipActive && (
                            <span className="text-4xl font-display font-bold text-white">
                                {daysRemaining} <span className="text-sm font-sans font-normal text-gray-400">DÍAS</span>
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        {isMembershipActive ? (
                            <>
                                <p className="text-2xl font-bold text-white uppercase">ACTIVA</p>
                                <p className="text-gray-400 text-sm">Vence el {new Date(user.membershipExpiry!).toLocaleDateString()}</p>
                                {isExpiringSoon && (
                                    <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-200 text-sm animate-pulse">
                                        ⚠️ Tu plan vence en menos de 3 días.
                                    </div>
                                )}
                            </>
                        ) : isPending ? (
                            <>
                                <p className="text-2xl font-bold text-yellow-500 uppercase">EN VERIFICACIÓN</p>
                                <p className="text-gray-400 text-sm">Tu pago está siendo revisado por un administrador.</p>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-gray-500 uppercase">{hasExpired ? 'VENCIDA' : 'INACTIVA'}</p>
                                <p className="text-gray-400 text-sm">
                                    {hasExpired ? 'Tu plan ha expirado.' : 'No tienes un plan activo actualmente.'}
                                </p>
                            </>
                        )}
                    </div>
                </Card>

                <Card title="Próxima Clase">
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500 italic">
                        <Calendar className="w-8 h-8 mb-2 opacity-50" />
                        <p>No tienes clases reservadas</p>
                    </div>
                    <Button variant="outline" className="w-full text-xs mt-auto" onClick={() => router.push('/classes')}>VER HORARIOS</Button>
                </Card>

                <Card title="Estadísticas">
                    <div className="flex justify-between items-center mb-2">
                        <span>Asistencias mes:</span>
                        <span className="text-white font-bold">0</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full w-[0%]"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center italic">Comienza a entrenar para ver tus stats.</p>
                </Card>
            </div>
        </div>
    );
}
