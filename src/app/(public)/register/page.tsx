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

const registerSchema = z.object({
    fullName: z.string().min(3, 'Nombre requerido'),
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
                fullName: data.fullName
            });
            login(user);
            router.push('/dashboard');
        } catch (err) {
            setError('Error al registrar. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-noise relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black pointer-events-none" />

            <Card className="w-full max-w-md z-10 animate-fade-in" noPadding>
                <div className="p-8">
                    <div className="text-center mb-8">
                        <UserPlus className="w-12 h-12 text-brand-green mx-auto mb-4" />
                        <h1 className="text-3xl font-display font-bold italic text-white">ÚNETE AL <span className="text-brand-green">CLAN</span></h1>
                        <p className="text-gray-500 text-sm mt-2">Comienza tu viaje hacia la excelencia</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Nombre Completo"
                            placeholder="Sarah Connor"
                            {...register('fullName')}
                            error={errors.fullName?.message}
                        />

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

                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            placeholder="••••••"
                            {...register('confirmPassword')}
                            error={errors.confirmPassword?.message}
                        />

                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-mono">{error}</div>}

                        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
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
            </Card>
        </div>
    );
}
