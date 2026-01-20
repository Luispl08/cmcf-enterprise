import { GymService } from "@/lib/firebase";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from 'next/link';

export default async function PlansPage() {
    const plans = await GymService.getPlans();

    // Sort plans: Recommended first
    plans.sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return 0;
    });

    return (
        <div className="min-h-screen bg-black pt-20 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-display font-bold italic text-white mb-4 uppercase">
                        NUESTROS <span className="text-brand-green">PLANES</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Elige el nivel de intensidad que se adapte a tus metas.
                        Desde acceso básico hasta entrenamiento personalizado de élite.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map(p => (
                        <Card key={p.id} className="flex flex-col hover:border-brand-green group h-full" noPadding>
                            <div className="p-8 flex flex-col h-full relative">
                                {p.recommended && <div className="absolute top-0 right-0 bg-brand-green text-black text-xs font-bold px-3 py-1 tracking-widest font-display">RECOMENDADO</div>}

                                <h3 className="text-3xl font-display font-bold italic text-white mb-2">{p.title}</h3>
                                <div className="text-5xl font-display font-bold text-brand-green mb-6">{p.currency}{p.price}</div>

                                <div className="text-gray-400 text-sm mb-8 flex-grow">
                                    {p.description}
                                </div>

                                <Link href={`/join?plan=${p.id}`} className="w-full mt-auto">
                                    <Button variant="outline" className="w-full group-hover:bg-brand-green group-hover:text-black hover:border-brand-green transition-all">SELECCIONAR</Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
