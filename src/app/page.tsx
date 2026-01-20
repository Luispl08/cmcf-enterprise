import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from 'next/link';
import { GymService } from "@/lib/firebase";
import { Zap, Trophy, HeartPulse, Star } from 'lucide-react';

export default async function Home() {
  const plans = await GymService.getPlans();
  const staff = await GymService.getStaff();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden border-b border-brand-green/30 bg-black">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40 grayscale contrast-125 brightness-75"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-9xl font-display font-bold italic tracking-tighter text-white mb-4 leading-none drop-shadow-lg">
            ROMPE TUS <br /> <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand-green to-green-700 stroke-white">LÍMITES</span>
          </h1>
          <Link href="/register">
            <Button size="lg" className="mt-8 text-2xl">EMPEZAR AHORA</Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <section className="bg-neutral-900 py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-display font-bold italic text-white mb-16 uppercase text-center relative z-10">
            ¿Por qué <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-white">CMCF</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:-translate-y-2 transition-transform duration-300">
              <Zap className="text-brand-green w-12 h-12 mb-4" />
              <h3 className="text-xl font-display italic text-white mb-2">Entrenamiento Híbrido</h3>
              <p className="text-gray-400">Combina lo mejor del CrossFit con culturismo funcional para resultados reales.</p>
            </Card>
            <Card className="hover:-translate-y-2 transition-transform duration-300">
              <Trophy className="text-brand-green w-12 h-12 mb-4" />
              <h3 className="text-xl font-display italic text-white mb-2">Comunidad Élite</h3>
              <p className="text-gray-400">Entrena con personas que te empujan a superar tus propios límites cada día.</p>
            </Card>
            <Card className="hover:-translate-y-2 transition-transform duration-300">
              <HeartPulse className="text-brand-green w-12 h-12 mb-4" />
              <h3 className="text-xl font-display italic text-white mb-2">Seguimiento Biométrico</h3>
              <p className="text-gray-400">Tecnología de última generación para monitorear tu progreso y vitales.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-6xl font-display font-bold italic text-white mb-12 uppercase text-center">PLANES <span className="text-brand-green">.</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map(p => (
            <Card key={p.id} className="flex flex-col hover:border-brand-green group h-full" noPadding>
              <div className="p-8 flex flex-col h-full relative">
                {p.recommended && <div className="absolute top-0 right-0 bg-brand-green text-black text-xs font-bold px-3 py-1 tracking-widest font-display">RECOMENDADO</div>}

                <h3 className="text-3xl font-display font-bold italic text-white mb-2">{p.title}</h3>
                <div className="text-5xl font-display font-bold text-brand-green mb-6">{p.currency}{p.price}</div>

                <div className="text-gray-400 text-sm mb-8 flex-grow">
                  {p.description}
                </div>

                <Link href={`/join?plan=${p.id}`} className="w-full mt-auto">
                  <Button variant="outline" className="w-full group-hover:bg-brand-green group-hover:text-black hover:border-brand-green transition-all">SELECCIONAR</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 py-20 bg-noise relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-3xl rounded-full pointer-events-none"></div>
        <h2 className="text-3xl md:text-5xl font-display font-bold italic text-white mb-12 uppercase text-center">
          Atletas <span className="text-brand-green">Reales</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card noPadding className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-gray-800 min-h-[200px] md:min-h-0 bg-[url('https://images.unsplash.com/photo-1548690312-e3b507d8c110?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')] bg-cover bg-center grayscale"></div>
            <div className="p-8 w-full md:w-2/3">
              <div className="flex text-brand-green mb-4">
                <Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} />
              </div>
              <p className="text-gray-300 italic mb-4">"CMCF cambió mi vida. No solo es el mejor box de la ciudad, es una familia que te hace indestructible."</p>
              <p className="font-display text-white text-lg">- Sarah Connor</p>
            </div>
          </Card>
          <Card noPadding className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-gray-800 min-h-[200px] md:min-h-0 bg-[url('https://images.unsplash.com/photo-1568254183919-78a4f43a2877?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')] bg-cover bg-center grayscale"></div>
            <div className="p-8 w-full md:w-2/3">
              <div className="flex text-brand-green mb-4">
                <Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} />
              </div>
              <p className="text-gray-300 italic mb-4">"Las instalaciones son de otro nivel. El ambiente industrial realmente te pone en modo bestia."</p>
              <p className="font-display text-white text-lg">- John R.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-green py-20 text-center">
        <h2 className="text-4xl md:text-6xl font-display font-bold italic text-black mb-8 uppercase">
          NO HAY <span className="text-white">EXCUSAS</span>
        </h2>
        <p className="text-black/80 text-xl max-w-2xl mx-auto mb-8 font-medium">
          Tu transformación comienza con una decisión. El dolor es temporal, la gloria es eterna.
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-black text-white hover:bg-neutral-800 border-none text-xl px-12 py-6 h-auto skew-x-[-10deg]">
            <span className="skew-x-[10deg] block">ÚNETE AL CLAN</span>
          </Button>
        </Link>
      </section>
    </div>
  );
}
