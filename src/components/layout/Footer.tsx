import Link from 'next/link';
import Image from 'next/image';
import { BicepsFlexed, Instagram } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-neutral-900 border-t border-white/10 text-white py-4 md:py-6">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">

                {/* Brand */}
                <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 hover:scale-105 transition-transform duration-300">
                        <Image
                            src="/logo.png"
                            alt="CMCF Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <p className="text-gray-400 text-xs max-w-[200px] leading-tight border-l border-white/10 pl-4 h-full flex items-center">
                        Forjando atletas de élite. Únete a la revolución.
                    </p>
                </div>

                {/* Social / Contact */}
                <div className="flex flex-row items-center gap-8 text-right">
                    <div className="text-xs text-gray-500 leading-tight hidden md:block">
                        <p>Av. Intercomunal Via Duaca, Km 11</p>
                        <p>Zona Norte Bqto.</p>
                    </div>

                    <div className="flex items-center gap-3 pl-8 md:border-l border-white/10">
                        <h3 className="font-display text-sm italic text-brand-green hidden md:block">Síguenos</h3>
                        <a href="https://www.instagram.com/cmcfitnesscenter" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-brand-green hover:text-black transition-colors group">
                            <Instagram size={24} className="group-hover:scale-110 transition-transform" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-4 pt-4 border-t border-white/5 text-center text-[10px] text-gray-600 font-mono">
                © {new Date().getFullYear()} CMCF FITNESS CENTER.
            </div>
        </footer>
    );
}
