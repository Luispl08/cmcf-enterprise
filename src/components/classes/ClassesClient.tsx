'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GymService } from '@/lib/firebase';
import { GymClass } from '@/types';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Calendar, Clock, User, Users, CheckCircle, XCircle } from 'lucide-react';
import { formatTime12h } from '@/lib/utils';

const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

interface ClassesClientProps {
    initialClasses: GymClass[];
}

export default function ClassesClient({ initialClasses }: ClassesClientProps) {
    const { user } = useAppStore();
    const [classes, setClasses] = useState<GymClass[]>(initialClasses);
    const [bookedClassIds, setBookedClassIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Initial sort
    useEffect(() => {
        setClasses(prev => [...prev].sort((a, b) => a.time.localeCompare(b.time)));
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [data, booked] = await Promise.all([
                GymService.getClasses(),
                user ? GymService.getUserBookings(user.uid) : Promise.resolve([])
            ]);
            setClasses(data.sort((a, b) => a.time.localeCompare(b.time)));
            setBookedClassIds(booked);
        } catch (error) {
            console.error("Error refreshing classes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        if (user?.uid) {
            GymService.getUserBookings(user.uid)
                .then(ids => {
                    if (mounted) setBookedClassIds(ids);
                })
                .catch(err => console.error("Error loading bookings:", err));
        }
        return () => { mounted = false; };
    }, [user?.uid]);

    const searchParams = useSearchParams();
    const actionParam = searchParams.get('action');
    const idParam = searchParams.get('id');

    // Auto-Action Effect
    useEffect(() => {
        if (user && actionParam === 'book' && idParam && classes.length > 0) {
            const targetClass = classes.find(c => c.id === idParam);
            if (targetClass) {
                // Clear params after triggering to avoid loops? 
                // We rely on handleAction confirmation dialog preventing loops.
                handleAction(targetClass, bookedClassIds.includes(targetClass.id));
                // Optional: Clean URL
                window.history.replaceState(null, '', '/classes');
            }
        }
    }, [user, actionParam, idParam, classes.length, bookedClassIds.length]);

    const handleAction = async (gymClass: GymClass, isBooked: boolean) => {
        if (!user) {
            const returnUrl = encodeURIComponent(`/classes?action=book&id=${gymClass.id}`);
            window.location.href = `/login?redirect=${returnUrl}`;
            return;
        }

        if (user.membershipStatus !== 'active') {
            alert('Necesitas una membresía activa.');
            return;
        }

        setProcessingId(gymClass.id);
        try {
            if (isBooked) {
                // Cancel
                if (!confirm(`¿Anular inscripción a ${gymClass.name}?`)) return;
                await GymService.cancelBooking(gymClass.id, user.uid);
                alert('Incripción anulada.');
            } else {
                // Book
                if (!confirm(`¿Reservar cupo para ${gymClass.name} a las ${gymClass.time}?`)) return;
                await GymService.bookClass(gymClass.id, user);
                alert('¡Reserva exitosa!');
            }
            refreshData();
        } catch (error: any) {
            alert(error.message || 'Error al procesar solicitud.');
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
                <div className="text-center text-brand-green animate-pulse">Actualizando...</div>
            ) : (
                <div className="space-y-12">
                    {DAYS.map(day => {
                        // Filter logic:
                        // 1. Match Day
                        // 2. If Special: Date must be NOT expired (e.g., show if date >= today - 1 day to allow checking yesterday? No, strictly future or today).
                        // Let's hide if date < Today Start.

                        const dayClasses = classes.filter(c => {
                            if (c.day !== day) return false;

                            if (c.isSpecial && c.date) {
                                // Auto-hide expired special classes (older than yesterday)
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                if (c.date < yesterday.getTime()) return false;
                            }
                            return true;
                        });

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
                                            <Card key={c.id} className={`relative group overflow-hidden transition-colors 
                                                ${c.isSpecial
                                                    ? 'border-amber-500/50 bg-amber-900/10 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                                    : isBooked
                                                        ? 'border-brand-green/50 bg-brand-green/5'
                                                        : 'border-neutral-800 hover:border-brand-green/30'
                                                }`}>

                                                {/* Special Badge */}
                                                {c.isSpecial && (
                                                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl shadow-lg z-10">
                                                        {c.date ? new Date(c.date).toLocaleDateString() : 'ESPECIAL'}
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-1 rounded mb-2 ${c.isSpecial ? 'text-amber-500 bg-amber-500/10' : 'text-brand-green bg-brand-green/10'}`}>
                                                            <Clock size={12} /> {formatTime12h(c.time)}
                                                        </span>
                                                        <h3 className={`text-xl font-bold ${c.isSpecial ? 'text-amber-500 italic' : 'text-white'}`}>{c.name}</h3>
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
                                                                className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : c.isSpecial ? 'bg-amber-500' : 'bg-brand-green'}`}
                                                                style={{ width: `${(c.bookedCount / c.capacity) * 100}%` }}
                                                            />
                                                        </div>
                                                    )}

                                                    <Button
                                                        onClick={() => handleAction(c, isBooked)}
                                                        disabled={(!isBooked && isFull) || processingId === c.id || (!!user && user.membershipStatus !== 'active')}
                                                        variant={isBooked ? 'danger' : 'primary'}
                                                        className={`w-full mt-4 
                                                            ${isBooked ? ''
                                                                : isFull ? 'bg-neutral-800 text-gray-500 cursor-not-allowed border-none'
                                                                    : c.isSpecial ? 'bg-amber-500 text-black hover:bg-white hover:text-amber-600 border-none' // Custom Gold Button for Special
                                                                        : ''}`}
                                                    >
                                                        {processingId === c.id ? (isBooked ? 'CANCELANDO...' : 'RESERVANDO...') : isBooked ? 'CANCELAR RESERVA' : isFull ? 'AGOTADO' : 'RESERVAR CUPO'}
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
