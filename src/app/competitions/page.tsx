'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GymService } from '@/lib/firebase';
import { Competition, UserProfile, CompetitionRegistration } from '@/types';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Trophy, Calendar, Users, MapPin, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function CompetitionsContent() {
    const router = useRouter(); // Use Next.js router
    const { user } = useAppStore();
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [userRegistrations, setUserRegistrations] = useState<CompetitionRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
    const [teamMembers, setTeamMembers] = useState<{ name: string, cedula: string }[]>([{ name: '', cedula: '' }]);
    const [teamName, setTeamName] = useState('');
    const [paymentData, setPaymentData] = useState<{ method: string, reference: string, amount: number }>({ method: 'pago_movil', reference: '', amount: 0 });

    const searchParams = useSearchParams();
    const actionParam = searchParams.get('action');
    const idParam = searchParams.get('id');

    useEffect(() => {
        const load = async () => {
            const data = await GymService.getCompetitions();
            setCompetitions(data);

            if (user) {
                const regs = await GymService.getUserCompetitions(user.uid);
                setUserRegistrations(regs);
            }

            setLoading(false);
        };
        load();
    }, [user]);

    // Auto-Join Effect
    useEffect(() => {
        if (user && actionParam === 'join' && idParam && competitions.length > 0 && !selectedComp) {
            const target = competitions.find(c => c.id === idParam);
            if (target) {
                // Open Modal
                setSelectedComp(target);
                setTeamMembers(Array.from({ length: (target.teamSize || 1) - 1 }, () => ({ name: '', cedula: '' })));
                // Set price if paid
                if (target.isPaid && target.price) {
                    setPaymentData(prev => ({ ...prev, amount: target.price! }));
                }
                // Optional: Clean URL
                window.history.replaceState(null, '', '/competitions');
            }
        }
    }, [user, actionParam, idParam, competitions, selectedComp]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedComp) return;

        // Validation
        if (selectedComp.type === 'team') {
            const validMembers = teamMembers.filter(m => m.name.trim() !== '');
            if (validMembers.length !== (selectedComp.teamSize || 0) - 1) {
                // Warning logic could be here
            }
        }

        // Legacy payment validation removed


        try {
            const membersList = [
                { name: user.fullName, cedula: user.cedula || '', userId: user.uid },
                ...teamMembers.filter(m => m.name.trim() !== '')
            ];

            if (selectedComp.type === 'team' && membersList.length !== selectedComp.teamSize) {
                alert(`El equipo debe tener exactamente ${selectedComp.teamSize} integrantes (incluyéndote).`);
                return;
            }

            // 1. Register with appropriate status
            const regId = await GymService.registerForCompetition(selectedComp.id, {
                userId: user.uid,
                leaderName: user.fullName,
                leaderCedula: user.cedula,
                leaderPhone: user.phone,
                competitionId: selectedComp.id,
                teamName: teamName,
                members: membersList,
                status: selectedComp.isPaid ? 'pending_payment' : 'confirmed'
            });

            if (selectedComp.isPaid) {
                // Redirect to Checkout
                router.push(`/competitions/checkout?competitionId=${selectedComp.id}&regId=${regId}`);
                return;
            }

            alert('¡Inscripción exitosa!');

            setSelectedComp(null);
            setTeamName('');
            setTeamMembers([{ name: '', cedula: '' }]);

            const data = await GymService.getCompetitions();
            setCompetitions(data);

        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Error al inscribirse');
        }
    };

    const addMemberRow = () => {
        if (!selectedComp?.teamSize) return;
        if (teamMembers.length < selectedComp.teamSize - 1) {
            setTeamMembers([...teamMembers, { name: '', cedula: '' }]);
        }
    };

    const updateMember = (index: number, field: 'name' | 'cedula', value: string) => {
        const newMembers = [...teamMembers];
        newMembers[index][field] = value;
        setTeamMembers(newMembers);
    };

    return (
        <div className="min-h-screen bg-noise pt-20 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12 animate-in slide-in-from-bottom-5">
                    <h1 className="text-4xl md:text-6xl font-display font-bold italic text-white mb-4">
                        PRÓXIMAS <span className="text-brand-green">COMPETENCIAS</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Demuestra tu nivel. Inscríbete en nuestros eventos y compite por grandes premios.
                    </p>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500">Cargando eventos...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {competitions.length === 0 ? (
                            <div className="col-span-full text-center py-12 border border-dashed border-gray-800 rounded-lg">
                                <Trophy className="mx-auto w-12 h-12 text-gray-600 mb-4" />
                                <p className="text-gray-500">No hay competencias programadas pronto.</p>
                            </div>
                        ) : (
                            competitions.map(comp => {
                                const userReg = userRegistrations.find(r => r.competitionId === comp.id);
                                const isPendingPayment = userReg?.status === 'pending_payment';
                                const isRegistered = !!userReg;

                                return (
                                    <Card key={comp.id} className="flex flex-col h-full hover:border-brand-green/50 transition-colors">
                                        <div className="bg-neutral-800 -mx-6 -mt-6 p-6 mb-4 flex justify-center items-center h-32 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-brand-green/10 group-hover:bg-brand-green/20 transition-colors"></div>
                                            <Trophy size={48} className="text-brand-green relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                                            {comp.isPaid && comp.price && (
                                                <div className="absolute top-2 right-2 bg-brand-green text-black font-bold px-2 py-1 text-xs rounded">
                                                    {comp.currency}{comp.price}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-bold font-display italic text-white mb-2">{comp.name}</h3>
                                        <div className="space-y-2 text-sm text-gray-400 mb-6 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-brand-green" />
                                                {format(comp.date, "EEEE d 'de' MMMM", { locale: es }).toUpperCase()}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-brand-green" />
                                                <span className="capitalize">{comp.type}</span>
                                                {comp.type === 'team' && ` (${comp.teamSize} pers.)`}
                                                <span className="px-1">•</span> <span className="capitalize">{comp.category}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${comp.registeredCount >= comp.capacity && !comp.isUnlimited ? 'bg-red-500' : 'bg-green-500'}`} />
                                                {comp.isUnlimited ? 'Cupos Ilimitados' :
                                                    comp.registeredCount >= comp.capacity ? 'AGOTADO' :
                                                        `${comp.capacity - comp.registeredCount} cupos disponibles`}
                                            </div>
                                            {isRegistered && (
                                                <div className="mt-2 text-brand-green font-bold text-sm uppercase">
                                                    Estado: {userReg?.status === 'pending_payment' ? 'Pago Pendiente' : 'Inscrito'}
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            className="w-full"
                                            disabled={(!comp.isUnlimited && comp.registeredCount >= comp.capacity && !isRegistered) || (isRegistered && !isPendingPayment)}
                                            onClick={() => {
                                                if (!user) {
                                                    const returnUrl = encodeURIComponent(`/competitions?action=join&id=${comp.id}`);
                                                    window.location.href = `/login?redirect=${returnUrl}`;
                                                    return;
                                                }

                                                if (isPendingPayment && userReg) {
                                                    // Resume Payment
                                                    router.push(`/competitions/checkout?competitionId=${comp.id}&regId=${userReg.id}`);
                                                    return;
                                                }

                                                if (isRegistered) return; // Should be disabled

                                                setSelectedComp(comp);
                                                setTeamMembers(Array.from({ length: (comp.teamSize || 1) - 1 }, () => ({ name: '', cedula: '' })));
                                            }}
                                            variant={isPendingPayment ? 'outline' : 'primary'}
                                        >
                                            {isPendingPayment ? 'PAGAR INSCRIPCIÓN' :
                                                isRegistered ? 'YA INSCRITO' :
                                                    (!comp.isUnlimited && comp.registeredCount >= comp.capacity) ? 'SOLD OUT' : 'INSCRIBIRSE'}
                                        </Button>
                                    </Card>
                                )
                            })
                        )}
                    </div>
                )}
            </div>

            {/* REGISTRATION MODAL */}
            {selectedComp && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <Card className="w-full max-w-lg relative animate-in zoom-in-95">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            onClick={() => setSelectedComp(null)}
                        >
                            <X />
                        </button>

                        <h2 className="text-2xl font-bold italic text-white mb-1">Confirmar Inscripción</h2>
                        <p className="text-brand-green mb-6">{selectedComp.name}</p>

                        <form onSubmit={handleRegister} className="space-y-4">

                            <div className="bg-neutral-900 p-4 rounded border border-gray-800">
                                <p className="text-sm text-gray-400 mb-2">Líder del Equipo / Participante</p>
                                <div className="font-bold text-white">{user?.fullName}</div>
                                <div className="text-xs text-gray-500">{user?.cedula}</div>
                            </div>

                            {selectedComp.type === 'team' && (
                                <>
                                    <Input
                                        label="Nombre del Equipo"
                                        value={teamName}
                                        onChange={e => setTeamName(e.target.value)}
                                        required
                                        placeholder="Ej: Los Espartanos"
                                    />

                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-gray-400">Integrantes Adicionales</label>
                                        {teamMembers.map((member, idx) => (
                                            <div key={idx} className="grid grid-cols-2 gap-2">
                                                <Input
                                                    placeholder="Nombre Completo"
                                                    value={member.name}
                                                    onChange={e => updateMember(idx, 'name', e.target.value)}
                                                    required
                                                />
                                                <Input
                                                    placeholder="Cédula"
                                                    value={member.cedula}
                                                    onChange={e => updateMember(idx, 'cedula', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {selectedComp.isPaid && (
                                <div className="text-center py-4 border-t border-gray-800 mt-4">
                                    <p className="text-sm text-gray-400">Esta competencia tiene un costo de inscripción:</p>
                                    <p className="text-2xl font-bold text-brand-green my-2">{selectedComp.currency}{selectedComp.price}</p>
                                    <p className="text-xs text-gray-500">Serás redirigido a la pasarela de pago.</p>
                                </div>
                            )}

                            <div className="pt-4">
                                <Button type="submit" className="w-full" size="lg">
                                    {selectedComp.isPaid ? 'CONTINUAR A PAGO' : 'COMPLETAR INSCRIPCIÓN'}
                                </Button>
                                <p className="text-center text-xs text-gray-500 mt-2">
                                    Al inscribirte aceptas las reglas de la competencia.
                                </p>
                            </div>

                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function CompetitionsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando...</div>}>
            <CompetitionsContent />
        </Suspense>
    );
}
