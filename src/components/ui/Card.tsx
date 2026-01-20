import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
    title?: string;
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export default function Card({ title, children, className, noPadding = false }: CardProps) {
    return (
        <div className={clsx(
            "relative group overflow-hidden bg-neutral-900/50 border border-white/10 backdrop-blur-sm",
            "hover:border-brand-green/50 transition-all duration-300",
            className
        )}>
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15px] right-[-15px] w-8 h-8 bg-brand-green rotate-45 transform opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>

            {title && (
                <div className="px-6 py-4 border-b border-white/5">
                    <h3 className="font-display italic text-xl text-white group-hover:text-brand-green transition-colors">
                        {title}
                    </h3>
                </div>
            )}

            <div className={clsx("text-gray-300", !noPadding && "p-6")}>
                {children}
            </div>
        </div>
    );
}
