import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
    return (
        <div className="bg-neutral-900 border border-gray-800 p-6 relative overflow-hidden group hover:border-brand-green/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-500 font-display italic text-sm uppercase tracking-wider">{title}</h3>
                    <div className="text-3xl font-mono font-bold text-white mt-1">{value}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg group-hover:bg-brand-green/20 group-hover:text-brand-green transition-colors text-gray-400">
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {trend && (
                <div className={clsx(
                    "text-xs font-mono flex items-center",
                    trendUp ? "text-brand-green" : "text-red-500"
                )}>
                    <span>{trendUp ? '↑' : '↓'} {trend}</span>
                    <span className="text-gray-600 ml-2">vs mes anterior</span>
                </div>
            )}
        </div>
    );
}
