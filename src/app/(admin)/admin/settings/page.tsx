'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { GymConfig } from '@/types';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
    const [config, setConfig] = useState<GymConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        const data = await GymService.getGymConfig();
        setConfig(data);
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config) return;
        setIsSaving(true);
        try {
            await GymService.updateGymConfig(config);
            alert('Configuración guardada exitosamente');
        } catch (error) {
            alert('Error al guardar configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const updateMethod = (key: string, value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            paymentMethods: {
                ...config.paymentMethods,
                [key]: value
            }
        });
    };

    if (isLoading) return <div className="p-8 text-white">Cargando configuración...</div>;
    if (!config) return <div className="p-8 text-white">Error al cargar configuración.</div>;

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    CONFIGURACIÓN <span className="text-brand-green">DEL GIMNASIO</span>
                </h1>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Payment Methods Section */}
                <Card>
                    <h2 className="text-xl font-display italic text-white mb-6 border-b border-gray-800 pb-2">
                        MÉTODOS DE PAGO (Instrucciones)
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-brand-green font-bold text-sm uppercase mb-2">Zelle</label>
                            <textarea
                                className="w-full bg-neutral-900 border border-gray-700 rounded p-3 text-white focus:border-brand-green outline-none min-h-[80px]"
                                value={config.paymentMethods.zelle || ''}
                                onChange={e => updateMethod('zelle', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Ej: Correo y Titular</p>
                        </div>

                        <div>
                            <label className="block text-brand-green font-bold text-sm uppercase mb-2">Pago Móvil</label>
                            <textarea
                                className="w-full bg-neutral-900 border border-gray-700 rounded p-3 text-white focus:border-brand-green outline-none min-h-[80px]"
                                value={config.paymentMethods.pago_movil || ''}
                                onChange={e => updateMethod('pago_movil', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Ej: Teléfono, Cédula, Banco</p>
                        </div>

                        <div>
                            <label className="block text-brand-green font-bold text-sm uppercase mb-2">Binance Pay</label>
                            <textarea
                                className="w-full bg-neutral-900 border border-gray-700 rounded p-3 text-white focus:border-brand-green outline-none min-h-[80px]"
                                value={config.paymentMethods.binance || ''}
                                onChange={e => updateMethod('binance', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-brand-green font-bold text-sm uppercase mb-2">Transferencia Bancaria</label>
                            <textarea
                                className="w-full bg-neutral-900 border border-gray-700 rounded p-3 text-white focus:border-brand-green outline-none min-h-[80px]"
                                value={config.paymentMethods.transferencia || ''}
                                onChange={e => updateMethod('transferencia', e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                {/* General Contact Info */}
                <Card>
                    <h2 className="text-xl font-display italic text-white mb-6 border-b border-gray-800 pb-2">
                        INFORMACIÓN DE CONTACTO
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Teléfono Principal"
                            value={config.contactPhone}
                            onChange={e => setConfig({ ...config, contactPhone: e.target.value })}
                        />
                        <Input
                            label="Email Soporte"
                            value={config.contactEmail}
                            onChange={e => setConfig({ ...config, contactEmail: e.target.value })}
                        />
                    </div>
                </Card>

                <div className="flex justify-end sticky bottom-8">
                    <Button type="submit" size="lg" disabled={isSaving} className="shadow-xl">
                        <Save className="mr-2 w-4 h-4" />
                        {isSaving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
