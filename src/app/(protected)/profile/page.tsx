'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { GymService } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { User, Mail, Phone, MapPin, Instagram, CreditCard } from 'lucide-react';

export default function ProfilePage() {
    const { user, setUser } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        instagram: '',
        address: '',
        cedula: '',
        dob: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                phone: user.phone || '',
                instagram: user.instagram || '',
                address: user.address || '',
                cedula: user.cedula || '',
                dob: user.dob || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        try {
            await GymService.updateUser(user.uid, formData);
            // Refresh local state
            const updatedProfile = await GymService.getUserProfile(user.uid);
            setUser(updatedProfile);
            alert('Perfil actualizado con éxito');
        } catch (error) {
            alert('Error al actualizar perfil');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
            <h1 className="text-4xl font-display font-bold italic text-white mb-8">MI <span className="text-brand-green">PERFIL</span></h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Info Card */}
                <Card className="h-fit">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mb-4 border-2 border-brand-green">
                            <span className="text-3xl font-bold text-brand-green">{user.fullName.charAt(0)}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{user.fullName}</h2>
                        <p className="text-gray-400 text-sm mb-4">{user.email}</p>

                        <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase mb-6 ${user.membershipStatus === 'active' ? 'bg-brand-green text-black' : 'bg-red-500/20 text-red-500'
                            }`}>
                            {user.membershipStatus === 'active' ? 'MIEMBRO ACTIVO' : 'Suscripción Inactiva'}
                        </div>

                        <div className="w-full text-left space-y-3 text-sm text-gray-400 border-t border-gray-800 pt-6">
                            <div className="flex items-center">
                                <User className="w-4 h-4 mr-3 text-brand-green" />
                                <span>ID: {user.cedula || 'No registrado'}</span>
                            </div>
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-3 text-brand-green" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            {user.membershipExpiry && (
                                <div className="flex items-center">
                                    <CreditCard className="w-4 h-4 mr-3 text-brand-green" />
                                    <span>Vence: {new Date(user.membershipExpiry).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Right Column: Edit Form */}
                <Card className="md:col-span-2">
                    <h3 className="text-xl font-display italic text-white mb-6">EDITAR INFORMACIÓN</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Teléfono"
                                icon={<Phone size={14} />}
                                placeholder="0414-1234567"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <Input
                                label="Instagram"
                                icon={<Instagram size={14} />}
                                placeholder="@usuario"
                                value={formData.instagram}
                                onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                            />
                        </div>

                        <Input
                            label="Dirección"
                            icon={<MapPin size={14} />}
                            placeholder="Tu dirección completa"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />

                        <div className="bg-yellow-900/10 border border-yellow-900/30 p-4 rounded text-xs text-yellow-500">
                            Nota: Para corregir tu Nombre, Cédula o Fecha de Nacimiento debes contactar a administración directamente.
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading} size="lg">
                                {isLoading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
