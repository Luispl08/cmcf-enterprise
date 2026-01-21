'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { GymService } from '@/lib/firebase';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Payment } from '@/types';

export default function PaymentHistoryPage() {
    const { user } = useAppStore();
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const loadPayments = async () => {
            try {
                const data = await GymService.getUserPayments(user.uid);
                setPayments(data);
            } catch (e) {
                console.error('Error loading payments:', e);
            } finally {
                setLoading(false);
            }
        };
        loadPayments();
    }, [user]);

    const getStatusBadge = (status: string) => {
        const badges = {
            approved: { label: 'APROBADO', className: 'bg-green-900/30 text-brand-green border-brand-green/50' },
            pending: { label: 'EN VERIFICACIÓN', className: 'bg-yellow-900/30 text-yellow-500 border-yellow-500/50' },
            rejected: { label: 'RECHAZADO', className: 'bg-red-900/30 text-red-500 border-red-500/50' },
            verification: { label: 'VERIFICANDO', className: 'bg-blue-900/30 text-blue-500 border-blue-500/50' }
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return <span className={`text-xs font-bold px-3 py-1 rounded border ${badge.className}`}>{badge.label}</span>;
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
                >
                    <ArrowLeft size={16} />
                    <span className="text-sm">Volver</span>
                </button>
                <h1 className="text-3xl font-display font-bold italic text-white mb-2">
                    HISTORIAL DE <span className="text-brand-green">PAGOS</span>
                </h1>
                <p className="text-gray-400">Todos tus pagos registrados en el sistema</p>
            </div>

            {loading ? (
                <Card>
                    <div className="text-center py-12 text-gray-500">Cargando historial...</div>
                </Card>
            ) : payments.length === 0 ? (
                <Card>
                    <div className="text-center py-12 text-gray-400 italic">
                        No tienes pagos registrados aún.
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {payments.map((payment) => (
                        <Card key={payment.id} className={
                            payment.status === 'rejected'
                                ? 'border-red-500/30'
                                : payment.status === 'approved'
                                    ? 'border-green-500/30'
                                    : 'border-gray-700'
                        }>
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl font-display font-bold text-white">
                                                {payment.currency}{payment.amount}
                                            </span>
                                            {getStatusBadge(payment.status)}
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            {new Date(payment.timestamp).toLocaleDateString('es-VE', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase mb-1">Método</p>
                                        <p className="text-white capitalize">{payment.method.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase mb-1">Referencia</p>
                                        <p className="text-white font-mono">{payment.reference}</p>
                                    </div>
                                </div>

                                {/* Rejection Feedback */}
                                {payment.status === 'rejected' && payment.feedback && (
                                    <div className="mt-4 pt-4 border-t border-red-500/30">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Motivo del rechazo:</p>
                                        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                                            <p className="text-sm text-red-400">{payment.feedback}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
