'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GymService } from '@/lib/firebase';
import { Competition, CompetitionRegistration } from '@/types';
import PaymentWizard from '@/components/checkout/PaymentWizard';
import { ArrowLeft } from 'lucide-react';

export default function CompetitionCheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const competitionId = searchParams.get('competitionId');
    const registrationId = searchParams.get('regId');

    const [competition, setCompetition] = useState<Competition | null>(null);
    const [registration, setRegistration] = useState<CompetitionRegistration | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!competitionId) {
                setError("Falta el ID de la competencia");
                setIsLoading(false);
                return;
            }

            try {
                // Fetch Competition
                const comps = await GymService.getCompetitions();
                const foundComp = comps.find(c => c.id === competitionId);

                if (!foundComp) {
                    setError("Competencia no encontrada");
                    setIsLoading(false);
                    return;
                }
                setCompetition(foundComp);

                // Fetch Registration (if provided) - Optional validation to ensure it exists
                // We're mostly trusting the passed ID for now or could fetch detailed registration if needed.

            } catch (err) {
                console.error(err);
                setError("Error cargando datos");
            }
            setIsLoading(false);
        };
        loadData();
    }, [competitionId, registrationId]);

    const handleBack = () => {
        router.back();
    };

    if (isLoading) return <div className="text-center py-20 text-brand-green font-display animate-pulse">CARGANDO...</div>;
    if (error || !competition) return <div className="text-center py-20 text-red-500">{error}</div>;

    // Adapt Competition to PaymentWizard's Expected Item Format
    const paymentItem = {
        id: competition.id,
        title: `Inscripción: ${competition.name}`,
        price: competition.price || 0,
        currency: competition.currency || '$',
        features: [
            `Categoría: ${competition.category}`,
            `Tipo: ${competition.type === 'team' ? 'Equipo' : 'Individual'}`,
            `Fecha: ${new Date(competition.date).toLocaleDateString()}`
        ],
        description: competition.description
    };

    return (
        <div className="min-h-screen bg-noise py-12 px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                <button
                    onClick={handleBack}
                    className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    VOLVER A COMPETENCIAS
                </button>

                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-display font-bold italic text-white uppercase">
                        FINALIZAR <span className="text-brand-green">INSCRIPCIÓN</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Completa el pago para confirmar tu participación.</p>
                </div>

                <PaymentWizard
                    itemData={paymentItem}
                    type="competition"
                    extraData={{
                        competitionId: competition.id,
                        registrationId: registrationId
                    }}
                />
            </div>
        </div>
    );
}
