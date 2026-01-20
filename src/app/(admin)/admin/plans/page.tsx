'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { Plan } from '@/types';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Save, DollarSign } from 'lucide-react';

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPlans = async () => {
        setLoading(true);
        const data = await GymService.getPlans();
        // If data is just mock (no id), we might have issues editing. 
        // In "Online" mode, GymService.getPlans() returns docs with IDs.
        setPlans(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleUpdatePrice = async (planId: string, newPrice: number) => {
        try {
            await GymService.updatePlan(planId, { price: newPrice });
            alert('Precio actualizado');
            // Optimistic update
            setPlans(prev => prev.map(p => p.id === planId ? { ...p, price: newPrice } : p));
        } catch (error) {
            alert('Error al actualizar (¿Estás en modo Mock?)');
        }
    };

    const toggleVisibility = async (plan: Plan) => {
        try {
            await GymService.updatePlan(plan.id, { visible: !plan.visible });
            setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, visible: !plan.visible } : p));
        } catch (error) {
            alert('Error al cambiar visibilidad');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    GESTIÓN DE <span className="text-brand-green">PRECIOS</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card key={plan.id} className="relative group">
                        <div className="absolute top-4 right-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={plan.visible}
                                    onChange={() => toggleVisibility(plan)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                            </label>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>
                        <p className="text-sm text-gray-500 mb-6 h-10">{plan.description}</p>

                        <div className="flex items-center gap-4">
                            <div className="w-full">
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Precio ({plan.currency})</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        defaultValue={plan.price}
                                        className="bg-neutral-900 border border-gray-700 text-white p-2 rounded w-full focus:border-brand-green outline-none"
                                        id={`price-${plan.id}`}
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const input = document.getElementById(`price-${plan.id}`) as HTMLInputElement;
                                            handleUpdatePrice(plan.id, Number(input.value));
                                        }}
                                    >
                                        <Save size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-800">
                            <ul className="text-xs text-gray-400 space-y-1">
                                {plan.features.slice(0, 3).map((f, i) => (
                                    <li key={i}>• {f}</li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
