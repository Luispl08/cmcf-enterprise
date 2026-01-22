'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { GymService } from '@/lib/firebase';
import { Plan } from '@/types';
import PaymentWizard from '@/components/checkout/PaymentWizard';
import { useAppStore } from '@/lib/store';

function JoinContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan');
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPlan = async () => {
            if (planId) {
                const plans = await GymService.getPlans();
                const found = plans.find(p => p.id === planId);
                if (found) setSelectedPlan(found);
            }
            setIsLoading(false);
        };
        loadPlan();
    }, [planId]);

    if (isLoading) return <div className="text-center py-20 text-brand-green font-display animate-pulse">CARGANDO PLAN...</div>;

    return (
        <div className="min-h-screen bg-noise py-12 px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-display font-bold italic text-white uppercase">
                        FINALIZAR <span className="text-brand-green">INSCRIPCIÓN</span>
                    </h1>
                </div>

                {selectedPlan ? (
                    <PaymentWizard selectedPlan={selectedPlan} />
                ) : (
                    <div className="text-center text-white">
                        <p>No se seleccionó ningún plan. Por favor regresa al inicio.</p>
                        {/* Fallback to plan selection could go here */}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-brand-green font-display animate-pulse">CARGANDO...</div>}>
            <JoinContent />
        </Suspense>
    );
}
