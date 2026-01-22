'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { GymService } from '@/lib/firebase';
import { Plan } from '@/types';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Check, CreditCard, Lock, Smartphone, Banknote, Landmark, QrCode, Split } from 'lucide-react';

interface PaymentWizardProps {
    selectedPlan?: Plan; // Kept for backward compatibility
    itemData?: {
        id: string;
        title: string;
        price: number;
        currency: string;
        features?: string[];
        description?: string;
    };
    type?: 'membership' | 'competition';
    extraData?: any; // { competitionId, registrationId, etc. }
}

type Step = 'summary' | 'method' | 'details' | 'success';
type PaymentMethod = 'credit_card' | 'zelle' | 'pago_movil' | 'binance' | 'transferencia' | 'efectivo' | 'split';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any; instructions: string }[] = [
    { id: 'zelle', label: 'Zelle', icon: Smartphone, instructions: 'Enviar a: pagosc mcf@gmail.com / Titular: CMCF Enterprise LLC' },
    { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, instructions: '0414-1234567 / CI: 12345678 / Banco: Mercantil' },
    { id: 'binance', label: 'Binance Pay', icon: QrCode, instructions: 'Pay ID: 123456789 / Email: crypto@cmcf.com' },
    { id: 'transferencia', label: 'Transferencia', icon: Landmark, instructions: 'Banco Mercantil / Cuenta: 0105...1234 / RIF: J-123456789' },
    { id: 'efectivo', label: 'Efectivo', icon: Banknote, instructions: 'Pagar directamente en recepción. Traer comprobante.' },
    { id: 'split', label: 'Pago Dividido / Múltiple', icon: Split, instructions: 'Selecciona dos métodos de pago y el monto para cada uno.' },
];

export default function PaymentWizard({ selectedPlan, itemData, type = 'membership', extraData }: PaymentWizardProps) {
    const router = useRouter();
    const { user } = useAppStore();
    const [step, setStep] = useState<Step>('summary');
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [reference, setReference] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<any>(null); // GymConfig
    const [rates, setRates] = useState<{ dolar: number, euro: number, fecha: string } | null>(null);

    // Normalize Item Data
    const item = itemData || (selectedPlan ? {
        id: selectedPlan.id,
        title: selectedPlan.title,
        price: selectedPlan.price,
        currency: selectedPlan.currency,
        features: selectedPlan.features,
        description: selectedPlan.description
    } : null);

    if (!item) return null;

    // Advanced Payment State
    const [isPartial, setIsPartial] = useState(false);
    const [payAmount, setPayAmount] = useState(item.price);

    // Split State
    const [splitSelection, setSplitSelection] = useState<{
        method1: PaymentMethod | '',
        amount1: number,
        ref1: string,
        method2: PaymentMethod | '',
        amount2: number,
        ref2: string
    }>({ method1: '', amount1: 0, ref1: '', method2: '', amount2: 0, ref2: '' });

    useEffect(() => {
        GymService.getGymConfig().then(setConfig);
        GymService.getExchangeRates().then(setRates);
        setPayAmount(item.price);
    }, [item]);

    const handleMethodSelect = (m: PaymentMethod) => {
        setMethod(m);
        setStep('details');
    };

    const handleSplitChange = (field: keyof typeof splitSelection, value: any) => {
        setSplitSelection(prev => ({ ...prev, [field]: value }));
    };

    // Helper function to calculate Bs amount based on plan currency
    const calculateBsAmount = (amount: number): number | undefined => {
        if (item.currency === 'Bs') {
            return amount;
        } else if (item.currency === '€') {
            return rates?.euro ? Number((amount * rates.euro).toFixed(2)) : undefined;
        } else {
            return rates?.dolar ? Number((amount * rates.dolar).toFixed(2)) : undefined;
        }
    };

    const getBsAmount = (amount: number, currency: string) => {
        if (!rates) return 0;
        const rate = currency === '€' ? rates.euro : rates.dolar;
        return (amount * rate).toFixed(2);
    };

    const getInstructions = (id: string) => {
        if (config && config.paymentMethods && config.paymentMethods[id]) {
            return config.paymentMethods[id];
        }
        return PAYMENT_METHODS.find(m => m.id === id)?.instructions;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!user || !method) return;

            // Fetch fresh exchange rates before processing payment
            const freshRates = await GymService.getExchangeRates();
            if (freshRates) {
                setRates(freshRates); // Update displayed rates
            }

            // Split Validation
            if (method === 'split') {
                const totalSplit = splitSelection.amount1 + splitSelection.amount2;
                if (Math.abs(totalSplit - payAmount) > 0.1) {
                    alert(`La suma de los pagos (${totalSplit}) debe ser igual al total a pagar (${payAmount})`);
                    setIsLoading(false);
                    return;
                }
                if (!splitSelection.method1 || !splitSelection.method2) {
                    alert('Selecciona ambos métodos de pago');
                    setIsLoading(false);
                    return;
                }
            }

            // All payments require manual verification
            const status = 'verification' as 'approved' | 'verification' | 'pending' | 'rejected';

            // Calculate Bs amount and exchange rate based on plan currency using FRESH rates
            let currentRate: number | undefined;
            let amountBsVal: number | undefined;

            if (item.currency === 'Bs') {
                // Plan is already in Bolívares, no conversion needed
                amountBsVal = payAmount;
                currentRate = undefined;
            } else if (item.currency === '€') {
                // Plan is in Euros, use fresh euro rate
                currentRate = freshRates?.euro;
                amountBsVal = currentRate ? Number((payAmount * currentRate).toFixed(2)) : undefined;
            } else {
                // Plan is in USD, use fresh dollar rate
                currentRate = freshRates?.dolar;
                amountBsVal = currentRate ? Number((payAmount * currentRate).toFixed(2)) : undefined;
            }

            const paymentData: any = {
                userId: user.uid,
                amount: payAmount,
                method: method,
                description: item.title, // Use normalized title
                userEmail: user.email,
                currency: item.currency,
                reference: method === 'split' ? `SPLIT-${Date.now()}` : reference,
                status: status,
                isPartial: isPartial || payAmount < item.price,
                timestamp: Date.now(),
                amountBs: amountBsVal,
                exchangeRate: currentRate,
                type: type // 'membership' | 'competition'
            };

            if (type === 'competition' && extraData?.competitionId) {
                paymentData.competitionId = extraData.competitionId;
                // Note: We might want to link paymentId to Registration here, but Registration already exists.
                // Or we update Registration with paymentId after?
                // Actually GymService.submitPayment returns ID.
                // We should probably update the registration record if we have the ID.
            } else {
                paymentData.planId = item.id;
            }

            if (method === 'split') {
                paymentData.splitDetails = [
                    { method: splitSelection.method1 as string, amount: splitSelection.amount1, reference: splitSelection.ref1 },
                    { method: splitSelection.method2 as string, amount: splitSelection.amount2, reference: splitSelection.ref2 }
                ];
            }

            const payId = await GymService.submitPayment(paymentData);

            // If Competition, we should update Registration status to 'pending_verification'? 
            // Or just leave it as 'pending_payment' until admin verifies?
            // The user requested: "The payment should appear in the Admin Dashboard".
            // That's handled by submitPayment.

            // NOTE: If we have registrationId, we could update it with paymentId.
            // But GymService.submitPayment is generic.
            // Let's assume Admin handles matching, OR we do a quick update here if possible.
            // But for now keeping it simple as per request scope.

            // Simulate processing
            setTimeout(() => {
                setStep('success');
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            console.error(error);
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
                <p className="text-gray-400 mb-4 max-w-sm mx-auto">
                    {type === 'competition'
                        ? 'Tu inscripción ha sido registrada. Tu pago será verificado por un administrador.'
                        : (isVerification
                            ? 'Tu pago ha sido registrado y está pendiente de verificación por un administrador.'
                            : `Bienvenido a la élite. Tu plan ${item.title} está activo.`
                        )
                    }
                </p>

                {/* Show payment details with BCV rate */}
                <div className="bg-neutral-800/50 rounded-lg p-4 max-w-sm mx-auto mb-8">
                    <div className="text-sm text-gray-400 mb-2">Monto pagado:</div>
                    <div className="text-2xl font-bold text-brand-green mb-3">
                        {item.currency}{payAmount}
                    </div>
                    {rates && item.currency !== 'Bs' && (
                        <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
                            <div>Equivalente: Bs {calculateBsAmount(payAmount)?.toFixed(2) || '...'}</div>
                            <div className="mt-1">
                                Tasa BCV: {item.currency === '€'
                                    ? `${rates.euro} Bs/€`
                                    : `${rates.dolar} Bs/$`}
                            </div>
                        </div>
                    )}
                    {item.currency === 'Bs' && (
                        <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
                            Precio en Bolívares
                        </div>
                    )}
                </div>

                <div className="flex gap-4 justify-center">
                    <Button onClick={() => router.push(type === 'competition' ? '/competitions' : '/dashboard')} size="lg" variant="primary">
                        {type === 'competition' ? 'VOLVER A COMPETENCIAS' : 'IR AL DASHBOARD'}
                    </Button>
                </div>
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
                        <h2 className="text-2xl font-display font-bold italic text-white">{item.title}</h2>
                        <p className="text-sm text-gray-500">{type === 'membership' ? 'Facturación mensual' : 'Pago único'}</p>
                    </div>
                    <div className="text-3xl font-display font-bold text-brand-green">
                        {item.currency}{item.price}
                    </div>
                </div>
                <ul className="space-y-2 mb-8">
                    {item.features?.map((f, i) => (
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

                        <div className="flex justify-between items-center text-lg font-bold text-white border-t border-gray-800 pt-4">
                            <span>TOTAL A PAGAR:</span>
                            <div className="text-right">
                                <span className="text-brand-green">{item.currency}{payAmount}</span>
                                {rates && item.currency !== 'Bs' && (
                                    <p className="text-xs text-gray-500 font-normal mt-1">
                                        {item.currency === '€'
                                            ? `Equivalente: Bs ${calculateBsAmount(payAmount)?.toFixed(2) || '...'} (Tasa BCV: ${rates.euro} Bs/€)`
                                            : `Equivalente: Bs ${calculateBsAmount(payAmount)?.toFixed(2) || '...'} (Tasa BCV: ${rates.dolar} Bs/$)`
                                        }
                                    </p>
                                )}
                                {item.currency === 'Bs' && (
                                    <p className="text-xs text-gray-500 font-normal mt-1">
                                        Precio en Bolívares
                                    </p>
                                )}
                            </div>
                        </div>

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

                        {method === 'split' ? (
                            <div className="space-y-6">
                                <p className="text-sm text-gray-400">Selecciona los dos métodos de pago y distribuye el monto total ({item.currency}{payAmount}).</p>

                                {[1, 2].map((num) => (
                                    <div key={num} className="bg-neutral-900 border border-gray-800 p-4 rounded">
                                        <h4 className="font-bold text-white mb-3">Pago {num}</h4>
                                        <div className="space-y-3">
                                            {/* Method Select */}
                                            <select
                                                className="w-full bg-black border border-gray-700 rounded p-2 text-white"
                                                value={splitSelection[`method${num}` as 'method1' | 'method2']}
                                                onChange={(e) => setSplitSelection({ ...splitSelection, [`method${num}`]: e.target.value })}
                                            >
                                                <option value="">Selecciona Método</option>
                                                {PAYMENT_METHODS.filter(p => p.id !== 'split').map(p => (
                                                    <option key={p.id} value={p.id}>{p.label}</option>
                                                ))}
                                            </select>

                                            {/* Instructions if selected */}
                                            {splitSelection[`method${num}` as 'method1' | 'method2'] && (
                                                <p className="text-xs text-gray-500 font-mono bg-black/50 p-2 rounded">
                                                    {getInstructions(splitSelection[`method${num}` as 'method1' | 'method2'] as string)}
                                                </p>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    label="Monto"
                                                    type="number"
                                                    value={splitSelection[`amount${num}` as 'amount1' | 'amount2']}
                                                    onChange={(e) => setSplitSelection({ ...splitSelection, [`amount${num}`]: Number(e.target.value) })}
                                                />
                                                <Input
                                                    label="Referencia"
                                                    placeholder="Ref/Comp"
                                                    value={splitSelection[`ref${num}` as 'ref1' | 'ref2']}
                                                    onChange={(e) => setSplitSelection({ ...splitSelection, [`ref${num}`]: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Instructions Box */}
                                <div className="bg-brand-green/5 border border-brand-green/20 p-4 rounded mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs text-brand-green font-bold uppercase">INSTRUCCIONES DE PAGO:</p>
                                        {['pago_movil', 'transferencia', 'efectivo'].includes(method) && rates && (
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 font-bold">MONTO A PAGAR EN BOLÍVARES</p>
                                                <p className="text-3xl font-mono text-brand-green font-bold tracking-tight">
                                                    Bs. {getBsAmount(payAmount, item.currency)}
                                                </p>
                                                <div className="text-xs text-gray-500 mt-1 flex flex-col items-end">
                                                    <span>Tasa BCV: {item.currency === '€' ? rates.euro : rates.dolar} Bs/{item.currency}</span>
                                                    <span className="opacity-75">({item.currency}{payAmount})</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300 font-mono">
                                        {getInstructions(method || '')}
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
