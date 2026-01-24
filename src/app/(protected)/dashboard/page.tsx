'use client';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Calendar, AlertTriangle, CheckCircle, Clock, Trophy } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { GymClass } from '@/types';
import { formatTime12h } from '@/lib/utils';

// Helper to map days to numbers (Sunday=0, Monday=1...) - matching typical getDay()
// BUT our GymClass might use 'LUNES', 'MARTES' etc.
const DAY_MAP: { [key: string]: number } = {
    'DOMINGO': 0, 'LUNES': 1, 'MARTES': 2, 'MIÉRCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'SÁBADO': 6
};

export default function DashboardPage() {
    const { user } = useAppStore();
    const router = useRouter();
    const [nextClass, setNextClass] = useState<GymClass | null>(null);
    const [loadingClass, setLoadingClass] = useState(true);

    // Membership Logic
    if (!user) return null;
    const isMembershipActive = user.membershipStatus === 'active' && user.membershipExpiry && user.membershipExpiry > Date.now();
    const isPending = user.membershipStatus === 'pending';
    const hasExpired = user.membershipStatus === 'active' && user.membershipExpiry && user.membershipExpiry <= Date.now();
    const daysRemaining = user.membershipExpiry ? differenceInDays(new Date(user.membershipExpiry), new Date()) : 0;
    const isExpiringSoon = isMembershipActive && daysRemaining <= 3 && daysRemaining >= 0;

    useEffect(() => {
        const fetchNextClass = async () => {
            if (!user) return;
            setLoadingClass(true);
            try {
                // Get bookings directly. We assume we want to show the specific Class instance the user has booked.
                // However, the current system seems to link bookings to 'Class IDs' which recur weekly.
                // So we need to find the *next occurrence* of that class.

                const [allClasses, bookedIds] = await Promise.all([
                    GymService.getClasses(),
                    GymService.getUserBookings(user.uid)
                ]);

                const userClasses = allClasses.filter(c => bookedIds.includes(c.id));

                if (userClasses.length === 0) {
                    setNextClass(null);
                    setLoadingClass(false);
                    return;
                }

                const now = new Date();
                const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday...

                // Calculate next occurrence date for each booked class
                const upcomingClasses = userClasses.map(c => {
                    const targetDayIndex = DAY_MAP[c.day.toUpperCase()];
                    if (targetDayIndex === undefined) return null;

                    // Calculate days until next occurrence
                    let daysUntil = targetDayIndex - currentDayIndex;

                    // Parse Time
                    const [timePart, period] = c.time.split(' ');
                    let [hours, minutes] = timePart.split(':').map(Number);
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;

                    const classDate = new Date(now);
                    classDate.setHours(hours, minutes, 0, 0);

                    // If it's today (daysUntil == 0) and time has passed, move to next week
                    if (daysUntil === 0 && classDate < now) {
                        daysUntil = 7;
                    } else if (daysUntil < 0) {
                        // It's in the past relative to weekday, so it's next week
                        daysUntil += 7;
                    }

                    // Set final date
                    classDate.setDate(now.getDate() + daysUntil);
                    return { ...c, date: classDate };
                }).filter((c): c is (GymClass & { date: Date }) => c !== null);

                // Sort by date/time ascending
                upcomingClasses.sort((a, b) => a.date.getTime() - b.date.getTime());

                setNextClass(upcomingClasses[0] || null);

            } catch (error) {
                console.error("Error fetching next class", error);
            } finally {
                setLoadingClass(false);
            }
        };

        if (user?.uid) {
            fetchNextClass();
        }
    }, [user?.uid]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 flex-wrap">
                <div>
                    <h1 className="text-4xl font-display font-bold italic text-white mb-2">
                        HOLA, <span className="text-brand-green uppercase">{user.fullName.split(' ')[0]}</span>
                    </h1>
                    <p className="text-gray-400">Bienvenido al panel de control de atleta.</p>
                </div>

                {/* CTA Buttons based on status */}
                {(!isMembershipActive && !isPending) ? (
                    <Button variant="primary" size="lg" onClick={() => router.push('/planes')}>
                        ACTIVAR MEMBRESÍA
                    </Button>
                ) : isMembershipActive ? (
                    <Button variant="outline" className="border-brand-green/50 text-brand-green hover:bg-brand-green/10" onClick={() => router.push('/planes')}>
                        ADELANTAR PAGO
                    </Button>
                ) : null}
                {isExpiringSoon && (
                    <Button variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10" onClick={() => router.push('/planes')}>
                        RENOVAR AHORA (VENCE PRONTO)
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Membership Status Card */}
                <Card title="ESTADO DE MEMBRESÍA" className="h-full relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${isMembershipActive ? 'bg-green-900/30 text-brand-green' : isPending ? 'bg-yellow-900/30 text-yellow-500' : 'bg-red-900/30 text-red-500'}`}>
                            {isMembershipActive ? <CheckCircle /> : isPending ? <Clock /> : <AlertTriangle />}
                        </div>
                        {isMembershipActive && (
                            <span className="text-4xl font-display font-bold text-white">
                                {daysRemaining} <span className="text-sm font-sans font-normal text-gray-400">DÍAS</span>
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        {isMembershipActive ? (
                            <>
                                <p className="text-2xl font-bold text-white uppercase">ACTIVA</p>
                                <p className="text-gray-400 text-sm">Vence el {new Date(user.membershipExpiry!).toLocaleDateString()}</p>
                                {isExpiringSoon && (
                                    <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-200 text-sm animate-pulse">
                                        ⚠️ Tu plan vence en menos de 3 días.
                                    </div>
                                )}
                            </>
                        ) : isPending ? (
                            <>
                                <p className="text-xl font-bold text-yellow-500 uppercase">EN VERIFICACIÓN</p>
                                <p className="text-gray-400 text-xs mt-1">Tu pago está siendo revisado.</p>
                            </>
                        ) : user.membershipStatus === 'rejected' ? (
                            <>
                                <p className="text-xl font-bold text-red-500 uppercase">PAGO RECHAZADO</p>
                                <p className="text-red-400 text-xs mt-1 bg-red-900/20 p-2 rounded border border-red-500/30">
                                    {user.rejectionFeedback || 'Consulta con administración.'}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-gray-500 uppercase">{hasExpired ? 'VENCIDA' : 'INACTIVA'}</p>
                                <p className="text-gray-400 text-sm">
                                    {hasExpired ? 'Tu plan ha expirado.' : 'No tienes un plan activo actualmente.'}
                                </p>
                            </>
                        )}
                    </div>
                </Card>

                <Card title="Próxima Clase" className="relative overflow-hidden">
                    {loadingClass ? (
                        <div className="flex flex-col items-center justify-center h-32 animate-pulse text-gray-500">
                            Cargando...
                        </div>
                    ) : nextClass ? (
                        <div className="flex flex-col">
                            <div className="flex-1 flex flex-col justify-center items-center text-center py-4">
                                <span className="text-3xl font-display font-bold text-white italic mb-2">{nextClass.name}</span>
                                <div className="flex items-center gap-2 text-brand-green text-lg font-bold bg-brand-green/10 px-3 py-1 rounded-full">
                                    <Clock size={16} />
                                    {nextClass.day} {formatTime12h(nextClass.time)}
                                </div>
                                <p className="text-sm text-gray-400 mt-2">{nextClass.coachName}</p>
                            </div>
                            <Button variant="outline" className="w-full text-xs mt-auto border-brand-green/30 text-brand-green hover:bg-brand-green/10" onClick={() => router.push('/classes')}>
                                VER MÁS CLASES
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500 italic">
                            <Calendar className="w-8 h-8 mb-2 opacity-50" />
                            <p>No tienes clases reservadas</p>
                            <Button variant="outline" className="w-full text-xs mt-auto" onClick={() => router.push('/classes')}>VER HORARIOS</Button>
                        </div>
                    )}
                </Card>

                <Card title="ESTADÍSTICAS">
                    <div className="flex flex-col items-center justify-center p-4">
                        <CheckCircle className="w-12 h-12 text-brand-green mb-2 opacity-80" />
                        <h3 className="text-4xl font-display font-bold text-white mb-1">{user.totalVisits || 0}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Entrenamientos Completados</p>
                    </div>
                    {user.lastVisit && (
                        <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                            <p className="text-xs text-gray-400">
                                Última visita: <span className="text-white">{new Date(user.lastVisit).toLocaleDateString()}</span>
                            </p>
                        </div>
                    )}
                </Card>

                {/* Payment History */}
                <PaymentHistoryCard user={user} />

                <ReviewCard user={user} />

                {/* Next Competition Widget */}
                <NextCompetitionCard user={user} />
            </div>
        </div >
    );
}

function NextCompetitionCard({ user }: { user: any }) {
    const [comp, setComp] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            try {
                const registrations = await GymService.getUserCompetitions(user.uid);
                if (registrations.length === 0) {
                    setLoading(false);
                    return;
                }

                // Get all competitions to match (efficency note: could be optimized to fetch only needed)
                const allComps = await GymService.getCompetitions();

                // Find user's upcoming competitions
                const myComps = allComps.filter(c =>
                    registrations.some(r => r.competitionId === c.id) && c.date > Date.now()
                ).sort((a, b) => a.date - b.date);

                if (myComps.length > 0) {
                    setComp(myComps[0]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    if (loading) return null; // Or skeleton

    if (!comp) {
        return (
            <Card title="COMPETENCIAS" className="relative overflow-hidden group hover:border-brand-green/30 transition-colors">
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="bg-neutral-800 p-3 rounded-full mb-3 group-hover:bg-brand-green/20 transition-colors">
                        <Trophy size={24} className="text-gray-500 group-hover:text-brand-green transition-colors" />
                    </div>
                    <p className="text-gray-400 text-sm mb-4">¿Listo para demostrar tu nivel?</p>
                    <Button variant="outline" className="w-full text-xs" onClick={() => router.push('/competitions')}>
                        VER EVENTOS
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card title="PRÓXIMA COMPETENCIA" className="relative overflow-hidden border-brand-green/30">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy size={100} className="text-brand-green" />
            </div>

            <div className="relative z-10">
                <h3 className="text-2xl font-display font-bold italic text-white mb-1">{comp.name}</h3>
                <div className="flex items-center gap-2 text-brand-green font-bold text-sm mb-4">
                    <Calendar size={14} />
                    {new Date(comp.date).toLocaleDateString()}
                </div>

                <div className="space-y-1 text-sm text-gray-400 mb-6">
                    <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                        Categoría: <span className="text-white capitalize">{comp.category}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                        Modalidad: <span className="text-white capitalize">{comp.type}</span>
                    </p>
                </div>

                <Button className="w-full" onClick={() => router.push('/competitions')}>
                    VER DETALLES
                </Button>
            </div>
        </Card>
    );
}

function ReviewCard({ user }: { user: any }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Import Star here if needed or reuse from lucide-react in parent scope
    // But since I can't easily add top-level imports in this specific replace block without context, 
    // I will assume Star is imported. Wait, I must Ensure Star is imported.
    // I'll update the top level imports first in a separate replace call if needed, OR just trust I can rely on 'lucide-react' being imported.
    // Actually, I can use the existing `lucide-react` import line if I had access to it, but I don't want to break the file.
    // I will define the component here and update the imports in a separate step or assume it's fine if I missed it? No, I must import Star.
    // I will assume Star is NOT imported yet (it was not in the file view).
    // So I will make a `ReviewComponent` inside `DashboardPage` or separate.
    // Better to include `Star` in the top imports.
    // I'll do this in two steps: 
    // 1. Add Star to imports. 
    // 2. Add the component code.

    // BUT I am in `ReplacementContent`. I cannot do two things here.
    // So I will write the component here, and verify the import later. The previous ViewFile showed `CheckCircle`, `Clock`, etc. but NOT `Star`.
    // I will use a simple text or unicode star if I can't import, but `lucide-react` is better.
    // I will assume I will fix imports in next step.

    const handleSubmit = async () => {
        if (!comment.trim()) return;
        setLoading(true);
        try {
            await GymService.addReview({
                userId: user.uid,
                userName: user.fullName,
                userPhotoUrl: user.photoUrl,
                rating,
                comment,
                date: Date.now(),
                approved: true
            });
            setSubmitted(true);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Card title="TU OPINIÓN" className="flex flex-col items-center justify-center text-center p-6 bg-brand-green/10 border-brand-green/30">
                <div className="bg-brand-green text-black rounded-full p-2 mb-2">
                    <CheckCircle size={24} />
                </div>
                <h3 className="text-white font-bold italic mb-1">¡GRACIAS!</h3>
                <p className="text-sm text-gray-400">Tu opinión nos hace más fuertes.</p>
            </Card>
        );
    }

    return (
        <Card title="DÉJANOS TU OPINIÓN">
            <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} type="button" className="transition-transform hover:scale-110 focus:outline-none">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill={star <= rating ? "#25D366" : "none"}
                                stroke={star <= rating ? "#25D366" : "#4B5563"}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-star"
                            >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        </button>
                    ))}
                </div>
                <textarea
                    className="w-full bg-black/50 border border-gray-700 rounded p-3 text-sm text-white placeholder-gray-500 focus:border-brand-green focus:outline-none resize-none"
                    rows={3}
                    placeholder="¿Qué te parece el box? (Opcional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
                <Button onClick={handleSubmit} disabled={loading || !comment.trim()} className="w-full">
                    {loading ? "ENVIANDO..." : "ENVIAR OPINIÓN"}
                </Button>
            </div>
        </Card>
    );
}

function PaymentHistoryCard({ user }: { user: any }) {
    const [latestPayment, setLatestPayment] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadPayments = async () => {
            try {
                const data = await GymService.getUserPayments(user.uid);
                setLatestPayment(data[0] || null);
            } catch (e) {
                console.error('Error loading payments:', e);
            } finally {
                setLoading(false);
            }
        };
        loadPayments();
    }, [user.uid]);

    const getStatusBadge = (status: string) => {
        const badges = {
            approved: { label: 'APROBADO', className: 'bg-green-900/30 text-brand-green border-brand-green/50' },
            pending: { label: 'EN VERIFICACIÓN', className: 'bg-yellow-900/30 text-yellow-500 border-yellow-500/50' },
            rejected: { label: 'RECHAZADO', className: 'bg-red-900/30 text-red-500 border-red-500/50' },
            verification: { label: 'VERIFICANDO', className: 'bg-blue-900/30 text-blue-500 border-blue-500/50' }
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return <span className={`text-[10px] font-bold px-2 py-1 rounded border ${badge.className}`}>{badge.label}</span>;
    };

    if (loading) {
        return (
            <Card title="ÚLTIMO PAGO" className="col-span-full md:col-span-2">
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            </Card>
        );
    }

    if (!latestPayment) {
        return (
            <Card title="HISTORIAL DE PAGOS" className="col-span-full">
                <div className="text-center py-8 text-gray-400 italic">
                    No tienes pagos registrados aún.
                </div>
            </Card>
        );
    }

    return (
        <Card title="ÚLTIMO PAGO" className="col-span-full md:col-span-2">
            <div className="space-y-4">
                <div className={`p-4 rounded border ${latestPayment.status === 'rejected'
                    ? 'border-red-500/30 bg-red-900/10'
                    : latestPayment.status === 'approved'
                        ? 'border-green-500/30 bg-green-900/10'
                        : 'border-gray-700 bg-neutral-900'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-display font-bold text-white">
                            {latestPayment.currency}{latestPayment.amount}
                        </span>
                        {getStatusBadge(latestPayment.status)}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                        <p>Método: <span className="text-gray-300 capitalize">{latestPayment.method.replace('_', ' ')}</span></p>
                        <p>Ref: <span className="text-gray-300">{latestPayment.reference}</span></p>
                        <p className="text-[10px]">{new Date(latestPayment.timestamp).toLocaleDateString('es-VE')}</p>
                    </div>

                    {latestPayment.status === 'rejected' && latestPayment.feedback && (
                        <div className="mt-3 pt-3 border-t border-red-500/30">
                            <p className="text-[10px] text-gray-500 uppercase mb-1">Motivo del rechazo:</p>
                            <p className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                                {latestPayment.feedback}
                            </p>
                        </div>
                    )}
                </div>

                <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => router.push('/historial-pagos')}
                >
                    VER HISTORIAL COMPLETO
                </Button>
            </div>
        </Card>
    );
}
