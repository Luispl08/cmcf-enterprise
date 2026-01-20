'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { Payment } from '@/types';
import { Button } from '@/components/ui/Button';
import { Check, X, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPayments = async () => {
        setLoading(true);
        const data = await GymService.getPendingPayments();
        setPayments(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const handleAction = async (payment: Payment, action: 'approve' | 'reject') => {
        if (!confirm(`¿Estás seguro de ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} este pago?`)) return;

        try {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            const feedback = action === 'reject' ? prompt('Motivo del rechazo:') || 'Datos inválidos' : undefined;

            await GymService.updatePaymentStatus(payment.id, newStatus, feedback);

            if (action === 'approve') {
                // Activate User Membership (30 days)
                await GymService.updateUser(payment.userId, {
                    membershipStatus: 'active',
                    membershipExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
                });
            }

            // Refresh list
            loadPayments();
        } catch (error) {
            alert('Error al procesar');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    VERIFICACIÓN DE <span className="text-brand-green">PAGOS</span>
                </h1>
                <Button variant="outline" onClick={loadPayments}>ACTUALIZAR</Button>
            </div>

            <div className="space-y-4">
                {loading ? <p className="text-gray-500">Cargando...</p> : payments.length === 0 ? (
                    <p className="text-gray-500">No hay pagos pendientes de revisión.</p>
                ) : (
                    payments.map(p => (
                        <Card key={p.id} noPadding className="flex flex-col md:flex-row items-center p-4 gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-white text-lg">{p.userEmail}</span>
                                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-900/40 text-yellow-500 border border-yellow-500/20 uppercase font-bold">
                                        {p.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 grid grid-cols-2 gap-x-8">
                                    <p>Monto: <span className="text-brand-green font-mono">{p.currency}{p.amount}</span></p>
                                    <p>Método: <span className="text-white uppercase">{p.method}</span></p>
                                    <p>Ref: <span className="text-white font-mono">{p.reference}</span></p>
                                    <p>Fecha: {new Date(p.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="bg-green-600 hover:bg-green-500 text-white border-none"
                                    onClick={() => handleAction(p, 'approve')}
                                >
                                    <Check className="w-4 h-4 mr-2" /> APROBAR
                                </Button>
                                <Button
                                    className="bg-red-900/50 hover:bg-red-900 text-red-200 border-red-800"
                                    onClick={() => handleAction(p, 'reject')}
                                >
                                    <X className="w-4 h-4 mr-2" /> RECHAZAR
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
