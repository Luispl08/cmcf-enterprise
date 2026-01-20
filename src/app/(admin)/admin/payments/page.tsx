'use client';
import { Button } from '@/components/ui/Button';
import { Search, Filter } from 'lucide-react';
import Input from '@/components/ui/Input';

// Mock Data
const MOCK_PAYMENTS = [
    { id: 'pay_1', user: 'Sarah Connor', amount: '$50.00', method: 'Tarjeta', status: 'APROBADO', date: '2024-01-20' },
    { id: 'pay_2', user: 'John Wick', amount: '$30.00', method: 'Zelle', status: 'PENDIENTE', date: '2024-01-19' },
];

export default function AdminPaymentsPage() {
    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    HISTORIAL DE <span className="text-brand-green">PAGOS</span>
                </h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> FILTRAR</Button>
                </div>
            </div>

            <div className="bg-neutral-900 border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black text-gray-400 font-display italic text-sm uppercase">
                        <tr>
                            <th className="p-4 font-normal">Usuario</th>
                            <th className="p-4 font-normal">Monto</th>
                            <th className="p-4 font-normal">Método</th>
                            <th className="p-4 font-normal">Fecha</th>
                            <th className="p-4 font-normal">Estado</th>
                            <th className="p-4 font-normal text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                        {MOCK_PAYMENTS.map(p => (
                            <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-bold text-white">{p.user}</td>
                                <td className="p-4 text-brand-green font-mono">{p.amount}</td>
                                <td className="p-4 text-gray-400">{p.method}</td>
                                <td className="p-4 text-gray-400">{p.date}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'APROBADO' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-500'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-brand-green hover:underline text-xs">DETALLES</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
