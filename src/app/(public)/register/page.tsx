'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { GymService } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const registerSchema = z.object({
    fullName: z.string().min(3, 'Nombre requerido'),
    cedula: z.string().min(6, 'Cédula inválida'),
    phone: z.string().min(10, 'Teléfono inválido'),
    dob: z.string().refine((val) => new Date(val).toString() !== 'Invalid Date', 'Fecha inválida'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAppStore();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        try {
            setError('');
            setIsLoading(true);
            const user = await GymService.register({
                email: data.email,
                password: data.password,
                fullName: data.fullName,
                cedula: data.cedula,
                phone: data.phone,
                dob: data.dob
            });
            login(user);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error al registrar. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] pt-20 pb-12 flex items-center justify-center px-4 relative bg-noise">
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <UserPlus className="w-12 h-12 text-brand-green mx-auto mb-4" />
                    <h1 className="text-3xl font-display font-bold italic text-white">
                        ÚNETE AL <span className="text-brand-green">CLAN</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Crea tu cuenta de atleta hoy mismo</p>
                </div>

                <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 p-8 shadow-2xl relative overflow-hidden group rounded-xl">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-green/10 -skew-x-12 translate-x-8 -translate-y-8 group-hover:bg-brand-green/20 transition-colors"></div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Input
                            label="NOMBRE COMPLETO"
                            placeholder="Ej. John Connor"
                            error={errors.fullName?.message}
                            {...register('fullName')}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="CÉDULA / ID"
                                placeholder="V-12345678"
                                error={errors.cedula?.message}
                                {...register('cedula')}
                            />
                            <Input
                                label="TELÉFONO"
                                placeholder="0414-0000000"
                                error={errors.phone?.message}
                                {...register('phone')}
                            />
                        </div>

                        <Input
                            label="FECHA DE NACIMIENTO"
                            type="date"
                            error={errors.dob?.message}
                            {...register('dob')}
                        />

                        <Input
                            label="EMAIL"
                            type="email"
                            placeholder="tu@email.com"
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Input
                            label="CONTRASEÑA"
                            type="password"
                            placeholder="••••••"
                            error={errors.password?.message}
                            {...register('password')}
                        />

                        <Input
                            label="CONFIRMAR CONTRASEÑA"
                            type="password"
                            placeholder="••••••"
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword')}
                        />

                        <Button
                            variant="primary"
                            className="w-full mt-4"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? 'REGISTRANDO...' : 'CREAR CUENTA'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-400">
                        ¿Ya tienes cuenta?{' '}
                        <Link href="/login" className="text-brand-green hover:underline decoration-brand-green/50 underline-offset-4 font-display italic">
                            INICIA SESIÓN
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
