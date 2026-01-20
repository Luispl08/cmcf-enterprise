'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { GymService } from '@/lib/firebase';
import { Plan } from '@/types';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Check, CreditCard, Lock, Smartphone, Banknote, Landmark, QrCode } from 'lucide-react';

interface PaymentWizardProps {
    selectedPlan: Plan;
}

type Step = 'summary' | 'method' | 'details' | 'success';
type PaymentMethod = 'credit_card' | 'zelle' | 'pago_movil' | 'binance' | 'transferencia' | 'efectivo';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any; instructions: string }[] = [
    { id: 'zelle', label: 'Zelle', icon: Smartphone, instructions: 'Enviar a: pagosc mcf@gmail.com / Titular: CMCF Enterprise LLC' },
    { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, instructions: '0414-1234567 / CI: 12345678 / Banco: Mercantil' },
    { id: 'binance', label: 'Binance Pay', icon: QrCode, instructions: 'Pay ID: 123456789 / Email: crypto@cmcf.com' },
    { id: 'transferencia', label: 'Transferencia', icon: Landmark, instructions: 'Banco Mercantil / Cuenta: 0105...1234 / RIF: J-123456789' },
    { id: 'efectivo', label: 'Efectivo', icon: Banknote, instructions: 'Pagar directamente en recepción. Traer comprobante.' },
    { id: 'credit_card', label: 'Tarjeta (Stripe)', icon: CreditCard, instructions: 'Procesamiento seguro vía Stripe' },
];

export default function PaymentWizard({ selectedPlan }: PaymentWizardProps) {
    const router = useRouter();
    const { user } = useAppStore();
    const [step, setStep] = useState<Step>('summary');
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [reference, setReference] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleMethodSelect = (m: PaymentMethod) => {
        setMethod(m);
        setStep('details');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!user || !method) return;

            // For manual methods, status is 'verification'. For Credit Card (Mock), it could be 'approved' immediately but let's stick to verification for uniformity in this enterprise flow or simulate instant.
            // User requested: "verification la hace el admin manualmente" -> imply all manual methods.
            // Let's assume Credit Card is instant (Mock) and others are manual.

            const isInstant = method === 'credit_card';
            const status = isInstant ? 'approved' : 'verification';

            await GymService.submitPayment({
                userId: user.uid,
                amount: selectedPlan.price,
                method: method,
                description: `Suscripción ${selectedPlan.title}`,
                userEmail: user.email,
                currency: selectedPlan.currency,
                reference: isInstant ? `CC-${Date.now()}` : reference,
                status: status,
                isPartial: false,
                timestamp: Date.now()
            });

            // Simulate processing
            setTimeout(() => {
                setStep('success');
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            setIsLoading(false);
            alert('Error al registrar el pago');
        }
    };

    if (step === 'success') {
        const isVerification = method !== 'credit_card';
        return (
            <Card className="text-center py-12 animate-fade-in" noPadding>
                <div className="flex justify-center mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isVerification ? 'bg-yellow-500' : 'bg-brand-green'}`}>
                        {isVerification ? <Lock className="w-10 h-10 text-black" /> : <Check className="w-10 h-10 text-black" />}
                    </div>
                </div>
                <h2 className="text-3xl font-display italic text-white mb-2">
                    {isVerification ? 'PAGO EN REVISIÓN' : '¡PAGO EXITOSO!'}
                </h2>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                    {isVerification
                        ? 'Tu pago ha sido registrado y está pendiente de verificación por un administrador. Te notificaremos cuando se apruebe.'
                        : `Bienvenido a la élite. Tu plan ${selectedPlan.title} está activo.`}
                </p>
                <Button onClick={() => router.push('/dashboard')} size="lg" variant={isVerification ? 'outline' : 'primary'}>
                    IR AL DASHBOARD
                </Button>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in max-w-5xl mx-auto">
            {/* Order Summary (Always Visible) */}
            <Card className="h-fit">
                <h3 className="font-display italic text-gray-400 text-sm tracking-widest mb-4">RESUMEN DE ORDEN</h3>
                <div className="flex justify-between items-end border-b border-gray-800 pb-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-display font-bold italic text-white">{selectedPlan.title}</h2>
                        <p className="text-sm text-gray-500">Facturación mensual</p>
                    </div>
                    <div className="text-3xl font-display font-bold text-brand-green">
                        {selectedPlan.currency}{selectedPlan.price}
                    </div>
                </div>
                <ul className="space-y-2 mb-8">
                    {selectedPlan.features?.map((f, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-300">
                            <Check className="text-brand-green w-4 h-4 mr-2" /> {f}
                        </li>
                    ))}
                </ul>
                <div className="bg-neutral-800/50 p-4 rounded text-xs text-gray-400 flex items-start">
                    <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
                    Transacción segura y encriptada.
                </div>
            </Card>

            {/* Steps Area */}
            <Card>
                {step === 'summary' && (
                    <div className="space-y-6">
                        <h3 className="font-display italic text-white text-xl">CONFIRMAR COMPRA</h3>
                        <p className="text-gray-400 text-sm">Estás a un paso de unirte. Selecciona cómo deseas pagar.</p>
                        <Button onClick={() => setStep('method')} className="w-full" size="lg">
                            CONTINUAR A PAGO
                        </Button>
                    </div>
                )}

                {step === 'method' && (
                    <div>
                        <h3 className="font-display italic text-gray-400 text-sm tracking-widest mb-6">SELECCIONA MÉTODO</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {PAYMENT_METHODS.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => handleMethodSelect(m.id)}
                                    className="flex items-center p-4 border border-gray-800 hover:border-brand-green/50 hover:bg-white/5 transition-all text-left group"
                                >
                                    <div className="bg-neutral-800 p-2 rounded mr-4 text-brand-green group-hover:text-white transition-colors">
                                        <m.icon size={20} />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-white uppercase">{m.label}</span>
                                        <span className="text-xs text-gray-500">{m.id === 'credit_card' ? 'Automático' : 'Verificación Manual'}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'details' && method && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center mb-6">
                            <button type="button" onClick={() => setStep('method')} className="text-xs text-gray-500 hover:text-white underline mr-4">
                                VOLVER
                            </button>
                            <h3 className="font-display italic text-white uppercase">DETALLES: <span className="text-brand-green">{PAYMENT_METHODS.find(m => m.id === method)?.label}</span></h3>
                        </div>

                        {/* Instructions Box */}
                        <div className="bg-brand-green/5 border border-brand-green/20 p-4 rounded mb-6">
                            <p className="text-xs text-brand-green font-bold uppercase mb-1">INSTRUCCIONES DE PAGO:</p>
                            <p className="text-sm text-gray-300 font-mono">
                                {PAYMENT_METHODS.find(m => m.id === method)?.instructions}
                            </p>
                        </div>

                        {method === 'credit_card' ? (
                            <>
                                <Input label="Titular" placeholder="NOMBRE EN TARJETA" required />
                                <Input label="Número" placeholder="0000 0000 0000 0000" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Exp" placeholder="MM/YY" required />
                                    <Input label="CVC" placeholder="123" type="password" required />
                                </div>
                            </>
                        ) : (
                            <>
                                <Input
                                    label="NÚMERO DE REFERENCIA / COMPROBANTE"
                                    placeholder="Ej. 12345678"
                                    required
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                />
                                <p className="text-xs text-gray-500">
                                    Por favor ingresa el número de confirmación de tu transacción para que podamos verificarla.
                                </p>
                            </>
                        )}

                        <Button type="submit" className="w-full mt-6" size="lg" disabled={isLoading}>
                            {isLoading ? 'ENVIANDO...' : 'REPORTAR PAGO'}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
}
