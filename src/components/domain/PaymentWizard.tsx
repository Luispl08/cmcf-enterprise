'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { GymService } from '@/lib/firebase';
import { useAppStore } from '@/lib/store';
import { Check, Upload, ArrowLeft } from 'lucide-react';

type PaymentStep = 'method' | 'details' | 'confirm';

export default function PaymentWizard() {
    const { user } = useAppStore();
    const [step, setStep] = useState<PaymentStep>('method');
    const [method, setMethod] = useState('');
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

    const selectedFile = watch('screenshot');

    const methods = [
        { id: 'zelle', label: 'Zelle', info: 'pagos@cmcf.com / Titular: CMCF INC' },
        { id: 'pago_movil', label: 'Pago Móvil', info: '0414-0000000 / CI: 12345678 / Banco Mercantil' },
        { id: 'efectivo', label: 'Efectivo', info: 'Entregar en recepción' },
    ];

    const onSubmit = async (data: any) => {
        if (!user) return;
        try {
            await GymService.submitPayment({
                userId: user.uid,
                userEmail: user.email,
                amount: parseFloat(data.amount),
                currency: '$',
                method: method as any, // casting for now
                reference: data.reference,
                isPartial: data.isPartial || false,
                ScreenshotUrl: '', // TODO: Implement real upload
            });
            setStep('confirm');
        } catch (e) {
            alert("Error enviando reporte");
        }
    };

    if (step === 'confirm') {
        return (
            <div className="text-center py-12 bg-neutral-900 border border-brand-green p-8">
                <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-6 text-black">
                    <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-display italic text-white mb-2">PAGO REPORTADO</h3>
                <p className="text-gray-400 font-mono text-sm mb-6">Tu pago está en cola de verificación. Te notificaremos cuando sea aprobado.</p>
                <Button onClick={() => setStep('method')} variant="outline">REPORTAR OTRO</Button>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 border border-gray-800 p-6 md:p-8">
            <h3 className="text-xl font-display italic text-white mb-6 border-b border-gray-800 pb-2 flex items-center justify-between">
                REPORTAR PAGO
                {step !== 'method' && <button onClick={() => setStep('method')} className="text-xs text-gray-500 hover:text-white font-mono flex items-center"><ArrowLeft size={12} className="mr-1" /> CAMBIAR</button>}
            </h3>

            {step === 'method' && (
                <div className="grid gap-3">
                    {methods.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => { setMethod(m.id); setStep('details'); }}
                            className="group text-left p-4 border border-gray-800 hover:border-brand-green hover:bg-black transition-all flex flex-col"
                        >
                            <span className="font-display italic text-lg text-white group-hover:text-brand-green">{m.label}</span>
                            <span className="text-xs text-gray-500 font-mono mt-1">{m.info}</span>
                        </button>
                    ))}
                </div>
            )}

            {step === 'details' && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-slide-down">
                    <div className="p-3 bg-brand-green/10 border border-brand-green/20 mb-4 text-sm text-brand-green font-mono">
                        Método: <span className="font-bold">{method.toUpperCase()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Monto ($)" type="number" step="0.01" {...register('amount', { required: true })} />
                        <Input label="Referencia (4 últ.)" {...register('reference', { required: true })} />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">Comprobante (Opcional)</label>
                        <div className="border border-dashed border-gray-700 p-8 text-center hover:border-brand-green/50 transition cursor-pointer bg-black">
                            <Upload className="mx-auto text-gray-600 mb-2" />
                            <span className="text-xs text-gray-500">Click para subir imagen</span>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-black border border-gray-800 cursor-pointer">
                        <input type="checkbox" {...register('isPartial')} className="accent-brand-green w-4 h-4" />
                        <span className="text-sm text-gray-300">Es un abono parcial</span>
                    </label>

                    <Button disabled={isSubmitting} className="w-full mt-2">ENVIAR REPORTE</Button>
                </form>
            )}
        </div>
    );
}
