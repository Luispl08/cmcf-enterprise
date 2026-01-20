'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { Plan } from '@/types';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Save, Plus, Trash2, Edit, X } from 'lucide-react';

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

    const loadPlans = async () => {
        setLoading(true);
        const data = await GymService.getPlans();
        setPlans(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const checkPassword = () => {
        const pwd = prompt("Ingrese la contraseña de seguridad (admin):");
        if (pwd !== 'admin123*') {
            alert("Contraseña incorrecta. Acceso denegado.");
            return false;
        }
        return true;
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingPlan({ features: [], currency: '$', visible: true, recommended: false });
        setIsModalOpen(true);
    };

    const handleDelete = async (planId: string) => {
        if (!checkPassword()) return;
        if (!confirm("¿Estás seguro de que deseas eliminar este plan?")) return;

        try {
            await GymService.deletePlan(planId);
            setPlans(prev => prev.filter(p => p.id !== planId));
            alert("Plan eliminado correctamente");
        } catch (error) {
            console.error(error);
            alert("Error al eliminar plan");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;

        // Validation
        if (!editingPlan.title || !editingPlan.price || !editingPlan.description) {
            alert("Completa los campos obligatorios");
            return;
        }

        if (!checkPassword()) return;

        try {
            if (editingPlan.id) {
                // Update
                await GymService.updatePlan(editingPlan.id, editingPlan);
                setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, ...editingPlan } as Plan : p));
                alert("Plan actualizado");
            } else {
                // Create
                // Ensure features is array
                const newPlan = { ...editingPlan } as Omit<Plan, 'id'>;
                const newId = await GymService.addPlan(newPlan);
                setPlans(prev => [...prev, { ...newPlan, id: newId }]);
                alert("Plan creado");
            }
            setIsModalOpen(false);
            setEditingPlan(null);
        } catch (error) {
            console.error(error);
            alert("Error al guardar cambios");
        }
    };

    const handleFeatureChange = (index: number, value: string) => {
        if (!editingPlan?.features) return;
        const newFeatures = [...editingPlan.features];
        newFeatures[index] = value;
        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    const addFeature = () => {
        setEditingPlan(prev => ({ ...prev, features: [...(prev?.features || []), ''] }));
    };

    const removeFeature = (index: number) => {
        if (!editingPlan?.features) return;
        const newFeatures = editingPlan.features.filter((_, i) => i !== index);
        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    GESTIÓN DE <span className="text-brand-green">PLANES</span>
                </h1>
                <Button onClick={handleCreate} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> AGREGAR PLAN
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card key={plan.id} className="relative group flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">{plan.title}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(plan)} className="text-gray-400 hover:text-white"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(plan.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        <div className="text-brand-green font-display text-2xl font-bold mb-2">
                            {plan.currency}{plan.price}
                        </div>
                        <p className="text-sm text-gray-500 mb-4 flex-grow">{plan.description}</p>

                        <div className="mt-auto border-t border-gray-800 pt-4">
                            <p className="text-xs text-brand-green uppercase font-bold mb-2">Características:</p>
                            <ul className="text-xs text-gray-400 space-y-1">
                                {plan.features?.map((f, i) => (
                                    <li key={i}>• {f}</li>
                                ))}
                            </ul>
                        </div>

                        {plan.visible ? (
                            <span className="absolute bottom-2 right-2 text-[10px] text-green-500 uppercase border border-green-500/30 px-1 rounded">Visible</span>
                        ) : (
                            <span className="absolute bottom-2 right-2 text-[10px] text-gray-500 uppercase border border-gray-700 px-1 rounded">Oculto</span>
                        )}
                    </Card>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && editingPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-neutral-900 border border-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-display italic text-white">
                                    {editingPlan.id ? 'EDITAR PLAN' : 'NUEVO PLAN'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <Input
                                    label="Título del Plan"
                                    value={editingPlan.title || ''}
                                    onChange={e => setEditingPlan({ ...editingPlan, title: e.target.value })}
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Precio"
                                        type="number"
                                        value={editingPlan.price || 0}
                                        onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                                        required
                                    />
                                    <Input
                                        label="Moneda ($/Bs)"
                                        value={editingPlan.currency || '$'}
                                        onChange={e => setEditingPlan({ ...editingPlan, currency: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-brand-green font-bold text-sm uppercase mb-2">Descripción</label>
                                    <textarea
                                        className="w-full bg-neutral-950 border border-gray-800 rounded p-2 text-white text-sm focus:border-brand-green outline-none h-24 resize-none"
                                        value={editingPlan.description || ''}
                                        onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-brand-green font-bold text-sm uppercase">Características</label>
                                        <button type="button" onClick={addFeature} className="text-xs text-brand-green hover:underline">+ Agregar</button>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                        {editingPlan.features?.map((f, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    className="w-full bg-neutral-950 border border-gray-800 rounded p-2 text-white text-xs focus:border-brand-green outline-none"
                                                    value={f}
                                                    onChange={e => handleFeatureChange(i, e.target.value)}
                                                    placeholder="Característica..."
                                                />
                                                <button type="button" onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        {(!editingPlan.features || editingPlan.features.length === 0) && (
                                            <p className="text-xs text-gray-600 italic">No hay características.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-gray-800">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingPlan.visible}
                                            onChange={e => setEditingPlan({ ...editingPlan, visible: e.target.checked })}
                                        />
                                        <span className="text-gray-300 text-sm">Visible al público</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingPlan.recommended}
                                            onChange={e => setEditingPlan({ ...editingPlan, recommended: e.target.checked })}
                                        />
                                        <span className="text-gray-300 text-sm">Destacado (Recomendado)</span>
                                    </label>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="button" variant="outline" className="mr-2" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit">
                                        <Save className="mr-2 h-4 w-4" /> GUARDAR
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
