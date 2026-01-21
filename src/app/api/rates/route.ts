import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log("API: Fetching BCV rates from DolarVZLA...");

        // Fetch from DolarVZLA API - provides current BCV official rates
        const response = await fetch('https://api.dolarvzla.com/public/exchange-rate', {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            },
            next: { revalidate: 0 } // No cache - always fetch fresh rates
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch rates: ${response.status}`);
        }

        const data = await response.json();

        // Extract current rates
        const current = data.current || {};
        const dolarPrice = current.usd || 0;
        const euroPrice = current.eur || 0;
        const fecha = current.date || new Date().toISOString().split('T')[0];

        console.log(`BCV Rates: ${dolarPrice} Bs/$, ${euroPrice} Bs/€ (${fecha})`);

        return NextResponse.json({
            dolar: Number(dolarPrice.toFixed(2)),
            euro: Number(euroPrice.toFixed(2)),
            fecha: new Date(fecha).toLocaleDateString('es-VE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        });

    } catch (error: any) {
        console.error("API Rates Error:", error);
        // Return error with fallback values
        return NextResponse.json({
            error: error.message,
            dolar: 347.26, // Current fallback
            euro: 407.17,  // Current fallback
            fecha: new Date().toLocaleDateString('es-VE')
        }, { status: 500 });
    }
}
