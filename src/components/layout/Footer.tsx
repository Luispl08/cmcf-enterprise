import Link from 'next/link';
import { BicepsFlexed, Instagram } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-neutral-900 border-t border-white/10 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Brand */}
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center group mb-4">
                        <BicepsFlexed className="text-brand-green h-8 w-8" />
                        <div className="ml-2 flex flex-col">
                            <span className="font-display text-xl tracking-widest italic leading-none">CMCF</span>
                            <span className="font-display text-[0.5rem] tracking-[0.2em] text-brand-green uppercase leading-none">FITNESS CENTER</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm max-w-sm">
                        Forjando atletas de élite con entrenamiento funcional de alto rendimiento.
                        Únete a la revolución del fitness industrial.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="font-display text-lg italic text-brand-green mb-4">Navegación</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
                        <li><Link href="/planes" className="hover:text-white transition-colors">Planes</Link></li>
                        <li><Link href="/horarios" className="hover:text-white transition-colors">Horarios</Link></li>
                        <li><Link href="/login" className="hover:text-white transition-colors">Mi Cuenta</Link></li>
                    </ul>
                </div>

                {/* Social / Contact */}
                <div>
                    <h3 className="font-display text-lg italic text-brand-green mb-4">Síguenos</h3>
                    <div className="flex space-x-4">
                        <a href="https://www.instagram.com/cmcfitnesscenter?igsh=Mm5maHNvM3ZsYW84" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-brand-green hover:text-black transition-colors">
                            <Instagram size={20} />
                        </a>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Calle Falsa 123, Ciudad</p>
                        <p>contacto@cmcfbox.com</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-600 font-mono">
                © {new Date().getFullYear()} CMCF FITNESS CENTER. TODOS LOS DERECHOS RESERVADOS.
            </div>
        </footer>
    );
}
