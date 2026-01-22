'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { GymClass } from '@/types';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Calendar, Clock, User, Users, CheckCircle } from 'lucide-react';

const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

export const dynamic = 'force-dynamic';

export default function UserClassesPage() {
    const { user } = useAppStore();
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [bookedClassIds, setBookedClassIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const [data, booked] = await Promise.all([
                GymService.getClasses(),
                user ? GymService.getUserBookings(user.uid) : Promise.resolve([])
            ]);
            // Sort by time
            setClasses(data.sort((a, b) => a.time.localeCompare(b.time)));
            setBookedClassIds(booked);
        } catch (error) {
            console.error("Error loading classes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.uid) loadClasses();
    }, [user?.uid]);

    const handleBook = async (gymClass: GymClass) => {
        if (!user) return;
        if (user.membershipStatus !== 'active') {
            alert('Necesitas una membresía activa para inscribirte.');
            return;
        }

        if (!confirm(`¿Confirmar reserva para ${gymClass.name} a las ${gymClass.time}?`)) return;

        setProcessingId(gymClass.id);
        try {
            await GymService.bookClass(gymClass.id, user);
            alert('¡Reserva exitosa!');
            loadClasses(); // Refresh to update counts
        } catch (error: any) {
            alert(error.message || 'Error al reservar. Puede que ya estés inscrito o la clase esté llena.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-neutral-950/50">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold italic text-white mb-2">
                    RESERVA TU <span className="text-brand-green">CLASE</span>
                </h1>
                <p className="text-gray-400">Asegura tu cupo. Solo para miembros activos.</p>
            </div>

            {loading ? (
                <div className="text-center text-brand-green animate-pulse">Cargando clases...</div>
            ) : (
                <div className="space-y-12">
                    {DAYS.map(day => {
                        const dayClasses = classes.filter(c => c.day === day);
                        if (dayClasses.length === 0) return null;

                        return (
                            <div key={day}>
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-display italic text-white">{day}</h2>
                                    <div className="h-px flex-1 bg-gradient-to-r from-brand-green/50 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {dayClasses.map(c => {
                                        const isFull = !c.isUnlimited && c.bookedCount >= c.capacity;
                                        const isBooked = bookedClassIds.includes(c.id);

                                        return (
                                            <Card key={c.id} className={`relative group overflow-hidden border-neutral-800 transition-colors ${isBooked ? 'border-brand-green/50 bg-brand-green/5' : 'hover:border-brand-green/30'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-green uppercase bg-brand-green/10 px-2 py-1 rounded mb-2">
                                                            <Clock size={12} /> {c.time}
                                                        </span>
                                                        <h3 className="text-xl font-bold text-white">{c.name}</h3>
                                                        <div className="flex items-center text-gray-400 text-sm mt-1">
                                                            <User size={14} className="mr-2" /> {c.coachName}
                                                        </div>
                                                    </div>
                                                    {isBooked && <CheckCircle className="text-brand-green" size={20} />}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-sm text-gray-400">
                                                        <span className="flex items-center gap-2"><Users size={14} /> Cupos</span>
                                                        <span className={isFull ? 'text-red-500 font-bold' : 'text-white'}>
                                                            {c.isUnlimited ? <span className="text-brand-green font-bold">ILIMITADO</span> : `${c.bookedCount} / ${c.capacity}`}
                                                        </span>
                                                    </div>
                                                    {!c.isUnlimited && (
                                                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-brand-green'}`}
                                                                style={{ width: `${(c.bookedCount / c.capacity) * 100}%` }}
                                                            />
                                                        </div>
                                                    )}

                                                    <Button
                                                        onClick={() => handleBook(c)}
                                                        disabled={isFull || isBooked || processingId === c.id || user?.membershipStatus !== 'active'}
                                                        className={`w-full mt-4 ${isBooked ? 'bg-brand-green/20 text-brand-green border-brand-green/50 hover:bg-brand-green/30' : isFull ? 'bg-neutral-800 text-gray-500 cursor-not-allowed border-none' : ''}`}
                                                    >
                                                        {processingId === c.id ? 'RESERVANDO...' : isBooked ? 'YA INSCRITO' : isFull ? 'AGOTADO' : 'RESERVAR CUPO'}
                                                    </Button>
                                                </div>
                                            </Card>

                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
