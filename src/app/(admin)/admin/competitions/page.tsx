'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { Competition, CompetitionRegistration } from '@/types';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, Trophy, Calendar, Users, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { format } from 'date-fns';

export default function AdminCompetitionsPage() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [newComp, setNewComp] = useState<Partial<Competition>>({
        name: '',
        description: '',
        date: Date.now(),
        type: 'individual',
        category: 'mixed',
        capacity: 50,
        isUnlimited: false,
        registeredCount: 0,
        isPaid: false,
        price: 0,
        currency: '$'
    });

    const [selectedCompForView, setSelectedCompForView] = useState<Competition | null>(null);
    const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);

    const handleViewRegistrations = async (comp: Competition) => {
        setSelectedCompForView(comp);
        setRegistrations([]); // Clear prev
        try {
            const data = await GymService.getCompetitionRegistrations(comp.id);
            setRegistrations(data);
        } catch (error) {
            console.error(error);
            alert("Error al cargar inscritos");
        }
    };

    const loadCompetitions = async () => {
        setLoading(true);
        const data = await GymService.getCompetitions();
        setCompetitions(data);
        setLoading(false);
    };

    useEffect(() => { loadCompetitions(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await GymService.addCompetition({
                ...newComp as Competition,
                registeredCount: 0
            });
            setIsAdding(false);
            setNewComp({
                name: '', description: '', date: Date.now(), type: 'individual', category: 'mixed', capacity: 50, isUnlimited: false, registeredCount: 0,
                isPaid: false, price: 0, currency: '$'
            });
            loadCompetitions();
        } catch (error) {
            alert('Error al crear competencia');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta competencia?')) return;
        await GymService.deleteCompetition(id);
        loadCompetitions();
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    GESTIÓN DE <span className="text-brand-green">COMPETENCIAS</span>
                </h1>
                <Button onClick={() => setIsAdding(true)}>
                    <Plus className="w-4 h-4 mr-2" /> NUEVA COMPETENCIA
                </Button>
            </div>

            {/* MODAL: NEW COMPETITION */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-xl font-bold text-white mb-4">Nueva Competencia</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <Input label="Nombre" value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })} required />
                            <Input label="Descripción" value={newComp.description} onChange={e => setNewComp({ ...newComp, description: e.target.value })} required />
                            <Input
                                label="Fecha"
                                type="date"
                                value={new Date(newComp.date || Date.now()).toISOString().split('T')[0]}
                                onChange={e => setNewComp({ ...newComp, date: new Date(e.target.value).getTime() })}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label>
                                    <select
                                        className="w-full bg-neutral-900 border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                        value={newComp.type}
                                        onChange={e => setNewComp({ ...newComp, type: e.target.value as any })}
                                    >
                                        <option value="individual">Individual</option>
                                        <option value="team">Equipos</option>
                                    </select>
                                </div>
                                {newComp.type === 'team' && (
                                    <Input
                                        label="Tamaño Equipo"
                                        type="number"
                                        value={String(newComp.teamSize || 2)}
                                        onChange={e => setNewComp({ ...newComp, teamSize: Number(e.target.value) })}
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoría</label>
                                <select
                                    className="w-full bg-neutral-900 border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                    value={newComp.category}
                                    onChange={e => setNewComp({ ...newComp, category: e.target.value as any })}
                                >
                                    <option value="male">Masculino</option>
                                    <option value="female">Femenino</option>
                                    <option value="mixed">Mixto</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Input
                                    label="Capacidad (Equipos/Personas)"
                                    type="number"
                                    value={String(newComp.capacity)}
                                    onChange={e => setNewComp({ ...newComp, capacity: Number(e.target.value) })}
                                    required={!newComp.isUnlimited}
                                    disabled={newComp.isUnlimited}
                                />
                                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newComp.isUnlimited || false}
                                        onChange={e => setNewComp({ ...newComp, isUnlimited: e.target.checked })}
                                        className="accent-brand-green"
                                    />
                                    Cupos Ilimitados
                                </label>
                            </div>

                            {/* PAID OPTIONS */}
                            <div className="pt-4 border-t border-gray-800">
                                <label className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer mb-3">
                                    <input
                                        type="checkbox"
                                        checked={newComp.isPaid || false}
                                        onChange={e => setNewComp({ ...newComp, isPaid: e.target.checked })}
                                        className="accent-brand-green w-4 h-4"
                                    />
                                    COMPETENCIA PAGA
                                </label>

                                {newComp.isPaid && (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                        <Input
                                            label="Precio"
                                            type="number"
                                            value={String(newComp.price || 0)}
                                            onChange={e => setNewComp({ ...newComp, price: Number(e.target.value) })}
                                            required
                                        />
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Moneda</label>
                                            <select
                                                className="w-full bg-neutral-900 border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                                value={newComp.currency || '$'}
                                                onChange={e => setNewComp({ ...newComp, currency: e.target.value })}
                                            >
                                                <option value="$">USD ($)</option>
                                                <option value="€">EUR (€)</option>
                                                <option value="Bs">W (Bs)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>CANCELAR</Button>
                                <Button type="submit" className="flex-1">CREAR</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* MODAL: VIEW REGISTRATIONS */}
            {selectedCompForView && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full relative max-h-[80vh] flex flex-col">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            onClick={() => setSelectedCompForView(null)}
                        >
                            <X />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-white mb-1">Inscritos: {selectedCompForView.name}</h2>
                            <p className="text-sm text-brand-green uppercase font-bold">{selectedCompForView.type === 'team' ? 'Equipos' : 'Individual'} • {registrations.length} Registros</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {registrations.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No hay inscritos aún.</p>
                            ) : (
                                registrations.map((reg) => (
                                    <div key={reg.id} className="bg-neutral-900 border border-gray-800 p-4 rounded">
                                        {selectedCompForView.type === 'team' ? (
                                            <>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-white font-bold text-lg">{reg.teamName}</h3>
                                                    <span className="text-xs text-gray-500">{new Date(reg.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <div className="mb-3 text-xs text-gray-400 bg-black/30 p-2 rounded border border-gray-800">
                                                    <p><span className="text-brand-green font-bold">LÍDER:</span> {reg.leaderName}</p>
                                                    <p>C.I: {reg.leaderCedula || 'N/A'} • Tlf: {reg.leaderPhone || 'N/A'}</p>
                                                </div>
                                                <div className="bg-black/50 p-2 rounded">
                                                    <p className="text-xs font-bold text-gray-500 mb-1">INTEGRANTES:</p>
                                                    <ul className="space-y-1">
                                                        {reg.members.map((m: any, idx: number) => (
                                                            <li key={idx} className="text-sm text-gray-300 flex justify-between">
                                                                <span>{idx + 1}. {m.name}</span>
                                                                <span className="text-gray-600 font-mono text-xs">{m.cedula}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-white font-bold">{reg.leaderName}</h3>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        <p>C.I: {reg.leaderCedula || reg.members[0]?.cedula || 'N/A'}</p>
                                                        <p>Tlf: {reg.leaderPhone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-500">{new Date(reg.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitions.map(comp => (
                    <div key={comp.id} className="bg-neutral-900 border border-gray-800 p-6 rounded hover:border-brand-green/30 transition-colors relative group">
                        <button
                            onClick={() => handleDelete(comp.id)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors z-10"
                            title="Eliminar"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className="text-brand-green" size={24} />
                            <h3 className="font-bold text-white text-xl">{comp.name}</h3>
                        </div>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{comp.description}</p>

                        <div className="space-y-2 text-sm text-gray-300 mb-6">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-brand-green" />
                                {format(comp.date, 'dd/MM/yyyy')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-brand-green" />
                                <span className="capitalize">{comp.type}</span>
                                {comp.type === 'team' && ` (${comp.teamSize} pers.)`}
                                <span className="text-gray-600 px-1">•</span>
                                <span className="capitalize">{comp.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={comp.registeredCount >= comp.capacity && !comp.isUnlimited ? "text-red-500" : "text-brand-green"}>
                                    {comp.registeredCount} / {comp.isUnlimited ? '∞' : comp.capacity} Inscritos
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full text-xs border-brand-green/30 text-brand-green hover:bg-brand-green/10"
                            onClick={() => handleViewRegistrations(comp)}
                        >
                            VER INSCRITOS
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
