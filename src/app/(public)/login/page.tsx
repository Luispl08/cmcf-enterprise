'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { GymService } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Image from 'next/image';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
    const router = useRouter();
    const { login } = useAppStore();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');

    const onSubmit = async (data: LoginFormData) => {
        try {
            setError('');
            setIsLoading(true);
            const user = await GymService.login(data.email, data.password);
            login(user);

            if (redirectUrl) {
                router.push(redirectUrl);
            } else if (user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Credenciales inválidas');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-noise relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black pointer-events-none" />

            <Card className="w-full max-w-lg z-10 animate-fade-in" noPadding>
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="relative w-48 h-48 mx-auto mb-2">
                            <Image
                                src="/logo.png"
                                alt="CMCF Logo"
                                fill
                                className="object-contain"
                                sizes="192px"
                            />
                        </div>
                        <h1 className="text-3xl font-display font-bold italic text-white">ACCESO AL <span className="text-brand-green">SISTEMA</span></h1>
                        <p className="text-gray-500 text-sm mt-2">Ingresa tus credenciales para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="usuario@cmcf.com"
                            {...register('email')}
                            error={errors.email?.message}
                        />

                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="••••••"
                            {...register('password')}
                            error={errors.password?.message}
                        />

                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-mono">{error}</div>}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'ACCEDIENDO...' : 'INGRESAR'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        ¿No tienes cuenta?{' '}
                        <Link href="/register" className="text-brand-green hover:underline decoration-brand-green/50 underline-offset-4 font-display italic">
                            REGÍSTRATE AHORA
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando...</div>}>
            <LoginForm />
        </Suspense>
    );
}
