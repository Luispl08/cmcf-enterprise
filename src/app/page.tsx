import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from 'next/link';
import { GymService } from "@/lib/firebase";
import { Zap, Trophy, HeartPulse, Star } from 'lucide-react';
import { formatTime12h } from "@/lib/utils";

export const revalidate = 60;

export default async function Home() {
  const plans = await GymService.getPlans();
  const reviews = await GymService.getReviews(4);
  const classes = await GymService.getClasses();
  const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

  return (
    <>
      {/* Hero */}
      <div className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden border-b border-brand-green/30 bg-black">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40 grayscale contrast-125 brightness-75"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-9xl font-display font-bold italic tracking-tighter text-white mb-4 leading-none drop-shadow-lg">
            ROMPE TUS <br /> <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand-green to-green-700 stroke-white">LÍMITES</span>
          </h1>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            <Link href="/login">
              <Button size="lg" className="text-xl px-8">EMPEZAR AHORA</Button>
            </Link>
            <Link href="/competitions">
              <Button size="lg" className="text-xl px-8">COMPETENCIAS</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="bg-neutral-900 py-12 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-display font-bold italic text-white mb-8 uppercase text-center relative z-10">
            ¿Por qué <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-white">CMCF</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:-translate-y-2 transition-transform duration-300 p-4">
              <Zap className="text-brand-green w-8 h-8 mb-2" />
              <h3 className="text-lg font-display italic text-white mb-1">Entrenamiento Híbrido</h3>
              <p className="text-gray-400 text-sm">Combina lo mejor del CrossFit con culturismo funcional para resultados reales.</p>
            </Card>
            <Card className="hover:-translate-y-2 transition-transform duration-300 p-4">
              <Trophy className="text-brand-green w-8 h-8 mb-2" />
              <h3 className="text-lg font-display italic text-white mb-1">Comunidad Élite</h3>
              <p className="text-gray-400 text-sm">Entrena con personas que te empujan a superar tus propios límites cada día.</p>
            </Card>
            <Card className="hover:-translate-y-2 transition-transform duration-300 p-4">
              <HeartPulse className="text-brand-green w-8 h-8 mb-2" />
              <h3 className="text-lg font-display italic text-white mb-1">Seguimiento Biométrico</h3>
              <p className="text-gray-400 text-sm">Tecnología de última generación para monitorear tu progreso y vitales.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Special Events Section */}
      {classes.some(c => c.isSpecial && c.date && c.date >= Date.now() - 86400000) && (
        <section className="py-10 bg-neutral-900 border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="max-w-5xl mx-auto px-4 relative z-10">
            <h2 className="text-2xl md:text-4xl font-display font-bold italic text-white mb-8 uppercase text-center">
              EVENTOS <span className="text-amber-500">ESPECIALES</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes
                .filter(c => c.isSpecial && c.date && c.date >= Date.now() - 86400000)
                .sort((a, b) => (a.date || 0) - (b.date || 0))
                .map(c => (
                  <div key={c.id} className="bg-black/50 p-4 rounded-lg border border-amber-500/50 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all group relative">
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-bl">
                      {new Date(c.date!).toLocaleDateString()}
                    </div>
                    <div className="mb-3">
                      <p className="text-xl font-display italic text-white group-hover:text-amber-500 transition-colors">{c.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {c.coachName}
                      </p>
                    </div>
                    <div className="flex justify-between items-end border-t border-white/10 pt-3">
                      <div className="text-amber-500 font-mono text-sm bg-amber-500/10 px-2 py-0.5 rounded">
                        {formatTime12h(c.time)}
                      </div>
                      <Link href={`/classes?action=book&id=${c.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black">
                          RESERVAR
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Schedule (Public - Regular Only) */}
      <section className="py-10 bg-black relative border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-display font-bold italic text-white mb-8 uppercase text-center">
            NUESTRAS <span className="text-brand-green">CLASES</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map(day => {
              // Filter: Only Regular classes (not special)
              const dayClasses = classes.filter(c => !c.isSpecial && c.day === day).sort((a, b) => a.time.localeCompare(b.time));
              if (dayClasses.length === 0) return null;

              return (
                <div key={day} className="bg-neutral-900/30 p-4 rounded-lg border border-white/5 hover:border-brand-green/20 transition-colors">
                  <h3 className="text-xl font-display italic text-brand-green mb-3 border-b border-white/10 pb-2">{day}</h3>
                  <div className="space-y-2">
                    {dayClasses.map(c => (
                      <div key={c.id} className="flex justify-between items-center group">
                        <div>
                          <p className="text-white font-bold text-sm group-hover:text-brand-green transition-colors">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.coachName}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-brand-green font-mono text-xs bg-brand-green/10 px-2 py-0.5 rounded">
                            {formatTime12h(c.time)}
                          </span>
                          {c.isUnlimited && <span className="text-[9px] text-gray-400 uppercase mt-0.5 block tracking-wider">Ilimitado</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plans Teaser */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center" id="plans">
        <h2 className="text-4xl md:text-6xl font-display font-bold italic text-white mb-8 uppercase">PLANES <span className="text-brand-green">.</span></h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-12">
          Diseñados para cada nivel de compromiso. Elige tu camino hacia la grandeza.
        </p>
        <Link href="/planes">
          <Button variant="outline" className="text-xl px-12 py-6 h-auto border-brand-green text-brand-green hover:bg-brand-green hover:text-black">
            VER TODOS LOS PLANES
          </Button>
        </Link>
      </section>

      {/* Trainers */}
      <section className="bg-black py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-display font-bold italic text-white mb-16 uppercase text-center relative z-10">
            NUESTRO <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-white">EQUIPO</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(await GymService.getTrainers()).filter(t => t.active).map((trainer) => (
              <Card key={trainer.id} noPadding className="relative group overflow-hidden h-[400px]">
                <div className="absolute inset-0">
                  {trainer.photoUrl ? (
                    <img src={trainer.photoUrl} alt={trainer.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <span className="text-4xl font-display italic text-gray-700">{trainer.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-display italic text-white mb-1">{trainer.name}</h3>
                  <p className="text-brand-green font-bold text-xs uppercase tracking-widest mb-2">
                    {trainer.specialties.slice(0, 2).join(' • ')}
                  </p>
                  <p className="text-gray-400 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {trainer.bio}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-4 py-10 bg-noise relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-3xl rounded-full pointer-events-none"></div>
        <h2 className="text-2xl md:text-4xl font-display font-bold italic text-white mb-8 uppercase text-center">
          OPINIÓN DE <span className="text-brand-green">USUARIOS</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id} noPadding className="flex flex-col md:flex-row h-full max-h-[160px]">
                <div className="w-full md:w-1/4 bg-gray-800 relative hidden md:block">
                  {review.userPhotoUrl ? (
                    <img src={review.userPhotoUrl} alt={review.userName} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 font-display text-2xl italic">
                      {review.userName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-4 w-full md:w-3/4 flex flex-col justify-center">
                  <div className="flex text-brand-green mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} fill="currentColor" size={12} className={i < review.rating ? "text-brand-green" : "text-gray-700"} />
                    ))}
                  </div>
                  <p className="text-gray-300 italic mb-2 text-sm line-clamp-2">"{review.comment}"</p>
                  <div>
                    <p className="font-display text-white text-sm">- {review.userName}</p>
                    <p className="text-[10px] text-gray-500">{new Date(review.date).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-2">Aún no hay opiniones. ¡Sé el primero en comentar!</p>
          )}
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
    </>
  );
}
