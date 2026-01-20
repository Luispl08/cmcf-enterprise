'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { GymService } from '@/lib/firebase';
import { Plan } from '@/types';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Check, CreditCard, Lock } from 'lucide-react';

interface PaymentWizardProps {
    selectedPlan: Plan;
}

type Step = 'summary' | 'payment' | 'success';

export default function PaymentWizard({ selectedPlan }: PaymentWizardProps) {
    const router = useRouter();
    const { user } = useAppStore();
    const [step, setStep] = useState<Step>('summary');
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!user) return;
            // Mock payment
            await GymService.submitPayment({
                userId: user.uid,
                amount: selectedPlan.price,
                method: 'credit_card',
                description: `Suscripción ${selectedPlan.title}`,
                userEmail: user.email,
                currency: selectedPlan.currency,
                reference: 'CC-' + Date.now(),
                isPartial: false
            });
            // Simulate processing time
            setTimeout(() => {
                setStep('success');
                setIsLoading(false);
            }, 1500);
        } catch (error) {
            setIsLoading(false);
            alert('Error en el pago');
        }
    };

    if (step === 'success') {
        return (
            <Card className="text-center py-12 animate-fade-in" noPadding>
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center">
                        <Check className="w-10 h-10 text-black" />
                    </div>
                </div>
                <h2 className="text-3xl font-display italic text-white mb-2">¡PAGO EXITOSO!</h2>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                    Bienvenido a la élite. Tu plan <strong>{selectedPlan.title}</strong> está activo.
                </p>
                <Button onClick={() => router.push('/dashboard')} size="lg">
                    IR AL DASHBOARD
                </Button>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {/* Left: Summary */}
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
                    <li className="flex items-center text-sm text-gray-300">
                        <Check className="text-brand-green w-4 h-4 mr-2" /> Acceso Inmediato
                    </li>
                </ul>
                <div className="bg-neutral-800/50 p-4 rounded text-xs text-gray-400 flex items-start">
                    <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
                    Transacción segura y encriptada. Puedes cancelar en cualquier momento desde tu panel de control.
                </div>
            </Card>

            {/* Right: Payment Form */}
            <Card>
                <h3 className="font-display italic text-gray-400 text-sm tracking-widest mb-6">MÉTODO DE PAGO</h3>

                <form onSubmit={handlePayment} className="space-y-6">
                    <div className="flex space-x-4 mb-6">
                        <div className="flex-1 bg-brand-green/10 border border-brand-green text-brand-green p-3 flex items-center justify-center cursor-pointer">
                            <CreditCard className="mr-2" /> Tarjeta
                        </div>
                        <div className="flex-1 bg-neutral-900 border border-neutral-700 text-gray-500 p-3 flex items-center justify-center opacity-50 cursor-not-allowed">
                            PayPal
                        </div>
                    </div>

                    <Input
                        label="Nombre en la tarjeta"
                        placeholder="COMO APARECE EN LA TARJETA"
                        required
                    />

                    <Input
                        label="Número de tarjeta"
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Expiración"
                            placeholder="MM/YY"
                            maxLength={5}
                            required
                        />
                        <Input
                            label="CVC"
                            placeholder="123"
                            maxLength={3}
                            type="password"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full mt-4" size="lg" disabled={isLoading}>
                        {isLoading ? 'PROCESANDO...' : `PAGAR ${selectedPlan.currency}${selectedPlan.price}`}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
