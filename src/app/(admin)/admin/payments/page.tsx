'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { Payment, Plan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Check, X, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'pending' | 'history'>('pending');

    const [plans, setPlans] = useState<Plan[]>([]);
    const [exchangeRate, setExchangeRate] = useState<number>(0);

    useEffect(() => {
        const loadStaticData = async () => {
            const [p, rates] = await Promise.all([
                GymService.getPlans(),
                GymService.getExchangeRates()
            ]);
            setPlans(p);
            if (rates) setExchangeRate(rates.dolar);
        };
        loadStaticData();
    }, []);

    const loadPayments = async () => {
        setLoading(true);
        const data = view === 'pending'
            ? await GymService.getPendingPayments()
            : await GymService.getAllPayments(100);
        setPayments(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPayments();
    }, [view]);

    const handleAction = async (payment: Payment, action: 'approve' | 'reject') => {
        if (action === 'approve') {
            if (!confirm(`¿Aprobar pago de ${payment.currency}${payment.amount}?`)) return;

            try {
                await GymService.approvePayment(payment.id, payment.userId);
                alert('Pago aprobado y membresía actualizada.');
            } catch (error) {
                console.error('Error al aprobar pago:', error);
                alert('Error al aprobar pago.');
                return; // Don't reload if approval failed
            }

            // Try to reload, but don't show error if this fails
            try {
                await loadPayments();
            } catch (error) {
                console.error('Error al recargar pagos (pero el pago fue aprobado):', error);
                // Silently fail - the payment was approved successfully
            }
        } else {
            // Reject Flow
            const feedback = prompt('Por favor ingresa el motivo del rechazo:', 'Comprobante ilegible / Monto incorrecto');
            if (feedback === null) return; // Cancelled

            try {
                await GymService.updatePaymentStatus(payment.id, 'rejected', feedback);
                alert('Pago rechazado.');
            } catch (error) {
                console.error('Error al rechazar pago:', error);
                alert('Error al rechazar pago.');
                return;
            }

            // Try to reload, but don't show error if this fails
            try {
                await loadPayments();
            } catch (error) {
                console.error('Error al recargar pagos (pero el pago fue rechazado):', error);
            }
        }
    };

    const [showManualPay, setShowManualPay] = useState(false);
    const [manualPayData, setManualPayData] = useState<{ cedula: string, amount: number, method: string, reference: string, planId: string }>({
        cedula: '', amount: 30, method: 'efectivo', reference: '', planId: ''
    });

    const handleManualPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await GymService.createManualPayment(manualPayData);
            alert('¡Pago registrado y usuario activado!');
            setShowManualPay(false);
            setManualPayData({ cedula: '', amount: 30, method: 'efectivo', reference: '', planId: '' });
            loadPayments();
        } catch (error: any) {
            alert(error.message || 'Error al registrar pago');
        }
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    GESTIÓN DE <span className="text-brand-green">PAGOS</span>
                </h1>

                <div className="flex gap-4 items-center">
                    <Button onClick={() => setShowManualPay(true)} className="bg-brand-green text-black hover:bg-brand-green/90">
                        REGISTRAR PAGO MANUAL
                    </Button>
                    <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg border border-gray-800">
                        <button
                            onClick={() => setView('pending')}
                            className={`px-4 py-2 rounded text-sm font-bold transition-colors ${view === 'pending' ? 'bg-brand-green text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            POR VERIFICAR
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={`px-4 py-2 rounded text-sm font-bold transition-colors ${view === 'history' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            HISTORIAL
                        </button>
                    </div>
                </div>
            </div>

            {/* MANUAL PAYMENT MODAL */}
            {showManualPay && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 p-6 rounded-lg max-w-md w-full border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-4">Registrar Pago Manual</h3>
                        <form onSubmit={handleManualPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cédula del Usuario</label>
                                <input
                                    className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                    value={manualPayData.cedula}
                                    onChange={e => setManualPayData({ ...manualPayData, cedula: e.target.value })}
                                    placeholder="V-12345678"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Plan (Opcional)</label>
                                <select
                                    className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                    value={manualPayData.planId}
                                    onChange={(e) => {
                                        const pid = e.target.value;
                                        const selectedPlan = plans.find(p => p.id === pid);
                                        setManualPayData({
                                            ...manualPayData,
                                            planId: pid,
                                            amount: selectedPlan ? selectedPlan.price : manualPayData.amount
                                        });
                                    }}
                                >
                                    <option value="">-- Seleccionar Plan --</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.title} (${p.price})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monto ($)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                        value={manualPayData.amount}
                                        onChange={e => setManualPayData({ ...manualPayData, amount: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Método</label>
                                    <select
                                        className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                        value={manualPayData.method}
                                        onChange={e => setManualPayData({ ...manualPayData, method: e.target.value })}
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="punto">Punto de Venta</option>
                                        <option value="pago_movil">Pago Móvil</option>
                                        <option value="zelle">Zelle</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="text-right">
                                {(manualPayData.method === 'pago_movil' || manualPayData.method === 'transferencia' || manualPayData.method === 'punto') && exchangeRate > 0 && (
                                    <p className="text-xs text-brand-green mt-1 font-mono">
                                        Bs. {(manualPayData.amount * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                        <span className="text-gray-500 block text-[10px]">Tasa: {exchangeRate}</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Referencia (Opcional)</label>
                                <input
                                    className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                    value={manualPayData.reference}
                                    onChange={e => setManualPayData({ ...manualPayData, reference: e.target.value })}
                                    placeholder="Ej. #123456 o EFECTIVO"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowManualPay(false)}>CANCELAR</Button>
                                <Button type="submit" className="flex-1">REGISTRAR PAGO</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {loading ? <p className="text-gray-500">Cargando...</p> : payments.length === 0 ? (
                    <p className="text-gray-500">No se encontraron pagos en esta sección.</p>
                ) : (
                    payments.map(p => (
                        <Card key={p.id} noPadding className="flex flex-col md:flex-row items-center p-4 gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-white text-lg">{p.userEmail}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs border uppercase font-bold ${p.status === 'verification' ? 'bg-yellow-900/40 text-yellow-500 border-yellow-500/20' :
                                        p.status === 'approved' ? 'bg-green-900/40 text-green-500 border-green-500/20' :
                                            p.status === 'rejected' ? 'bg-red-900/40 text-red-500 border-red-500/20' :
                                                'bg-gray-800 text-gray-400 border-gray-700'
                                        }`}>
                                        {p.status}
                                    </span>
                                    {p.isPartial && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-purple-900/40 text-purple-400 border border-purple-500/20 uppercase font-bold">
                                            PARCIAL
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-400">
                                    <div className="grid grid-cols-2 gap-x-8 mb-2">
                                        <p>Monto Total: <span className="text-brand-green font-mono">{p.currency}{p.amount}</span>
                                            {p.amountBs && (
                                                <span className="text-gray-400 ml-2 text-xs">
                                                    (Bs. {p.amountBs} @ {p.exchangeRate})
                                                </span>
                                            )}
                                        </p>
                                        <p>Método: <span className="text-white uppercase">{p.method === 'split' ? 'DIVIDIDO' : p.method}</span></p>
                                        <p>Fecha: {new Date(p.timestamp).toLocaleDateString()} {new Date(p.timestamp).toLocaleTimeString()}</p>
                                    </div>

                                    {p.method === 'split' && p.splitDetails ? (
                                        <div className="bg-black/50 p-2 rounded border border-gray-800 text-xs">
                                            <p className="font-bold text-gray-500 mb-1">DETALLES DEL PAGO:</p>
                                            {p.splitDetails.map((d, i) => (
                                                <div key={i} className="flex justify-between border-b border-gray-800 last:border-0 py-1">
                                                    <span className="uppercase text-white">{d.method}</span>
                                                    <span>{p.currency}{d.amount}</span>
                                                    <span className="font-mono text-gray-500">{d.reference}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>Ref: <span className="text-white font-mono">{p.reference}</span></p>
                                    )}
                                </div>
                            </div>

                            {/* Only show actions if in pending/verification status */}
                            {(p.status === 'pending' || p.status === 'verification') && (
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
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
