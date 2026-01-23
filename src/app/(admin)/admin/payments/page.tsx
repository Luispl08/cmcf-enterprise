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
    const [type, setType] = useState<'membership' | 'competition'>('membership');

    // Action Modal State
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        payment: Payment | null;
        action: 'approve' | 'reject';
        feedback: string;
    }>({
        isOpen: false,
        payment: null,
        action: 'approve',
        feedback: ''
    });

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
            ? await GymService.getPendingPayments(type)
            : await GymService.getAllPayments(100, type);
        setPayments(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPayments();
    }, [view, type]);

    const openActionModal = (payment: Payment, action: 'approve' | 'reject') => {
        setActionModal({
            isOpen: true,
            payment,
            action,
            feedback: action === 'reject' ? 'Comprobante ilegible / Monto incorrecto' : ''
        });
    };

    const processAction = async () => {
        const { payment, action, feedback } = actionModal;
        if (!payment) return;

        try {
            if (action === 'approve') {
                await GymService.approvePayment(payment.id, payment.userId);
                alert('Pago aprobado y procesado exitosamente.');
            } else {
                if (!feedback.trim()) {
                    alert('Por favor ingresa el motivo del rechazo.');
                    return;
                }
                await GymService.updatePaymentStatus(payment.id, 'rejected', feedback);
                alert('Pago rechazado correctamente.');
            }

            setActionModal({ ...actionModal, isOpen: false });
            await loadPayments();
        } catch (error) {
            console.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} pago:`, error);
            alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
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

                    {/* TYPE TABS */}
                    <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg border border-gray-800">
                        <button
                            onClick={() => setType('membership')}
                            className={`px-4 py-2 rounded text-sm font-bold transition-colors ${type === 'membership' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            MEMBRESÍAS
                        </button>
                        <button
                            onClick={() => setType('competition')}
                            className={`px-4 py-2 rounded text-sm font-bold transition-colors ${type === 'competition' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            COMPETENCIAS
                        </button>
                    </div>

                    <div className="w-[1px] h-8 bg-gray-800 mx-2"></div>

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

            {/* ACTION MODAL */}
            {actionModal.isOpen && actionModal.payment && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {actionModal.action === 'approve' ? '¿Aprobar Pago?' : 'Rechazar Pago'}
                        </h3>

                        <div className="mb-6">
                            <p className="text-gray-300 text-sm mb-2">
                                Usuario: <span className="font-bold text-white">{actionModal.payment.userEmail}</span>
                            </p>
                            <p className="text-gray-300 text-sm mb-4">
                                Monto: <span className="font-bold text-brand-green">{actionModal.payment.currency}{actionModal.payment.amount}</span>
                            </p>

                            {actionModal.action === 'reject' && (
                                <div>
                                    <label className="block text-xs font-bold text-red-400 uppercase mb-2">Motivo del rechazo</label>
                                    <textarea
                                        className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:border-red-500 outline-none h-24 resize-none"
                                        value={actionModal.feedback}
                                        onChange={e => setActionModal({ ...actionModal, feedback: e.target.value })}
                                        placeholder="Describe por qué se rechaza el pago..."
                                    />
                                </div>
                            )}

                            {actionModal.action === 'approve' && (
                                <p className="text-sm text-gray-400 italic">
                                    Al aprobar, se {actionModal.payment.type === 'competition' || actionModal.payment.competitionId ? 'confirmará la inscripción en la competencia' : 'activará la membresía del usuario'} automáticamente.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className={actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}
                                onClick={processAction}
                            >
                                {actionModal.action === 'approve' ? 'CONFIRMAR APROBACIÓN' : 'CONFIRMAR RECHAZO'}
                            </Button>
                        </div>
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
                                    {(p.type === 'competition' || p.competitionId) && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-orange-900/40 text-orange-400 border border-orange-500/20 uppercase font-bold">
                                            COMPETENCIA
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
                                        {p.description && <p className="col-span-2 text-xs text-white mt-1 italic opacity-80">{p.description}</p>}
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
                                        onClick={() => openActionModal(p, 'approve')}
                                    >
                                        <Check className="w-4 h-4 mr-2" /> APROBAR
                                    </Button>
                                    <Button
                                        className="bg-red-900/50 hover:bg-red-900 text-red-200 border-red-800"
                                        onClick={() => openActionModal(p, 'reject')}
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
