'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { GymClass } from '@/types';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, Clock, Users, User } from 'lucide-react';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

export default function AdminClassesPage() {
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Class Form State
    const [newClass, setNewClass] = useState<Partial<GymClass>>({
        day: 'LUNES',
        time: '',
        name: '',
        coachName: '',
        capacity: 20,
        bookedCount: 0
    });

    const loadClasses = async () => {
        setLoading(true);
        const data = await GymService.getClasses();
        setClasses(data);
        setLoading(false);
    };

    useEffect(() => {
        loadClasses();
    }, []);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await GymService.addClass({
                ...newClass as GymClass,
                coachId: 'mock-coach', // simplified for now
            });
            setIsAdding(false);
            setNewClass({ day: 'LUNES', time: '', name: '', coachName: '', capacity: 20, bookedCount: 0 }); // reset
            loadClasses();
        } catch (error) {
            alert('Error al crear clase');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta clase?')) return;
        await GymService.deleteClass(id);
        loadClasses();
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    PROGRAMACIÓN DE <span className="text-brand-green">CLASES</span>
                </h1>
                <Button onClick={() => setIsAdding(true)}>
                    <Plus className="w-4 h-4 mr-2" /> NUEVA CLASE
                </Button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full relative">
                        <h2 className="text-xl font-bold text-white mb-4">Nueva Clase Recurrente</h2>
                        <form onSubmit={handleAddClass} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Día</label>
                                <select
                                    className="w-full bg-neutral-900 border border-gray-700 text-white p-3 rounded focus:border-brand-green outline-none"
                                    value={newClass.day}
                                    onChange={e => setNewClass({ ...newClass, day: e.target.value as any })}
                                >
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <Input label="Nombre de la Clase" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required placeholder="CROSSFIT" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Hora" type="time" value={newClass.time} onChange={e => setNewClass({ ...newClass, time: e.target.value })} required />
                                <Input label="Capacidad" type="number" value={String(newClass.capacity)} onChange={e => setNewClass({ ...newClass, capacity: Number(e.target.value) })} required />
                            </div>
                            <Input label="Entrenador" value={newClass.coachName} onChange={e => setNewClass({ ...newClass, coachName: e.target.value })} required placeholder="Coach Name" />

                            <div className="flex gap-2 mt-6">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>CANCELAR</Button>
                                <Button type="submit" className="flex-1">GUARDAR</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            <div className="space-y-8">
                {DAYS.map(day => {
                    const dayClasses = classes.filter(c => c.day === day).sort((a, b) => a.time.localeCompare(b.time));
                    if (dayClasses.length === 0) return null;

                    return (
                        <div key={day}>
                            <h3 className="text-brand-green font-display italic text-xl border-b border-gray-800 pb-2 mb-4">{day}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dayClasses.map(c => (
                                    <div key={c.id} className="bg-neutral-900 border border-gray-800 p-4 rounded hover:border-brand-green/30 transition-colors relative group">
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white text-lg">{c.name}</h4>
                                            <span className="flex items-center text-brand-green font-mono text-sm bg-brand-green/10 px-2 py-1 rounded">
                                                <Clock size={12} className="mr-1" /> {c.time}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-gray-400 text-sm mb-1">
                                            <User size={14} className="mr-2" /> {c.coachName}
                                        </div>
                                        <div className="flex items-center text-gray-400 text-sm">
                                            <Users size={14} className="mr-2" /> {c.bookedCount} / {c.capacity} Cupos
                                        </div>
                                        {/* Progress Bar for Capacity */}
                                        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand-green"
                                                style={{ width: `${(c.bookedCount / c.capacity) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
