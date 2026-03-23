'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { ArrowRight, Package, Clock, Star, ChevronRight } from 'lucide-react';

export default function App() {
  const [categories, setCategories] = useState([]);
  const [featuredProps, setFeaturedProps] = useState([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catsRes, propsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/props')
      ]);
      const cats = await catsRes.json();
      const props = await propsRes.json();
      setCategories(Array.isArray(cats) ? cats.slice(0, 6) : []);
      setFeaturedProps(Array.isArray(props) ? props.slice(0, 4) : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      setSeeded(true);
      fetchData();
      alert(`Datos de prueba creados!\nAdmin: ${data.adminEmail} / ${data.adminPassword}\nCliente: ${data.clientEmail} / ${data.clientPassword}`);
    } catch (e) {
      alert('Error al crear datos de prueba');
    }
  };

  return (
    <div className="min-h-screen bg-[#ffc832]">
      <Navbar />

      {/* Seed Banner — only when no data */}
      {categories.length === 0 && !seeded && (
        <div className="bg-black text-[#ffc832] border-b-4 border-[#ffc832] px-4 py-3 text-center">
          <span className="font-bold text-sm mr-4">🚀 Base de datos vacía — Carga datos de demostración para explorar la app</span>
          <button onClick={handleSeed} className="bg-[#ffc832] text-black border-2 border-[#ffc832] px-4 py-1 font-black text-sm uppercase hover:bg-white transition-colors">
            Cargar Demo
          </button>
        </div>
      )}

      {/* HERO */}
      <section className="border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block bg-black text-[#ffc832] border-4 border-black px-4 py-1 text-sm font-black uppercase mb-6 shadow-brutal-sm">
                Props para Producción Publicitaria
              </div>
              <h1 className="font-heading text-6xl md:text-8xl font-black leading-none text-black mb-6 uppercase tracking-tighter">
                HANG<br/>AR
              </h1>
              <p className="text-lg font-medium text-black mb-8 max-w-md leading-relaxed">
                El catálogo de renta de props más completo para producciones audiovisuales. Muebles, decoración y arte para tu próxima campaña.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/catalogo" className="btn-brutal inline-flex items-center gap-2">
                  Ver Catálogo <ArrowRight size={20} />
                </Link>
                <Link href="#sobre-nosotros" className="btn-brutal-white inline-flex items-center gap-2">
                  Sobre Nosotros
                </Link>
              </div>
            </div>

            {/* Brutalist graphic element */}
            <div className="hidden md:block relative">
              <div className="bg-black border-4 border-black shadow-brutal-lg w-full aspect-square max-w-md ml-auto overflow-hidden">
                {featuredProps[0]?.images?.[0]?.url ? (
                  <img
                    src={featuredProps[0].images[0].url}
                    alt="Featured prop"
                    className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
                  />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <span className="text-[#ffc832] font-black text-6xl">H</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#ffc832] border-4 border-black px-4 py-2 font-black text-black text-sm shadow-brutal">
                +{featuredProps.length > 0 ? '100' : '0'} PROPS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b-4 border-black bg-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-0">
            {[
              { num: '100+', label: 'Props Disponibles' },
              { num: '24h', label: 'Respuesta Garantizada' },
              { num: '10+', label: 'Años de Experiencia' }
            ].map((s, i) => (
              <div key={i} className={`px-8 py-6 text-center ${i < 2 ? 'border-r-4 border-[#ffc832]' : ''}`}>
                <div className="font-heading text-4xl font-black text-[#ffc832]">{s.num}</div>
                <div className="text-sm font-bold text-white uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="border-b-4 border-black py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-heading text-4xl font-black uppercase text-black">Categorías</h2>
              <Link href="/catalogo" className="flex items-center gap-1 font-bold text-black underline decoration-4 underline-offset-4 text-sm uppercase">
                Ver todo <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoryId=${cat.id}`}
                  className="group bg-white border-4 border-black shadow-brutal hover:shadow-brutal-xs hover:translate-x-[4px] hover:translate-y-[4px] transition-all p-6 flex items-center justify-between"
                >
                  <span className="font-heading text-lg font-black uppercase text-black">{cat.name}</span>
                  <ChevronRight size={20} className="text-black group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED PROPS */}
      {featuredProps.length > 0 && (
        <section className="border-b-4 border-black py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-heading text-4xl font-black uppercase text-black">Props Destacados</h2>
              <Link href="/catalogo" className="flex items-center gap-1 font-bold text-black underline decoration-4 underline-offset-4 text-sm uppercase">
                Ver catálogo <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProps.map((prop) => (
                <Link
                  key={prop.id}
                  href={`/catalogo/${prop.id}`}
                  className="group bg-white border-4 border-black shadow-brutal hover:shadow-brutal-xs hover:translate-x-[4px] hover:translate-y-[4px] transition-all overflow-hidden"
                >
                  <div className="aspect-square border-b-4 border-black overflow-hidden bg-gray-100">
                    {prop.images?.[0]?.url ? (
                      <img src={prop.images[0].url} alt={prop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-[#ffc832] flex items-center justify-center">
                        <Package size={40} className="text-black" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-black text-sm uppercase mb-1 line-clamp-2">{prop.name}</h3>
                    <p className="text-xs text-gray-600 mb-3">{prop.dimensions}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-lg">S/ {prop.pricePerDay?.toLocaleString('es-PE')}<span className="text-xs font-normal text-gray-500">/día</span></span>
                      <span className="bg-black text-[#ffc832] text-xs font-bold px-2 py-1">VER</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="border-b-4 border-black py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-heading text-4xl font-black uppercase text-black mb-12 text-center">¿Cómo Funciona?</h2>
          <div className="grid md:grid-cols-3 gap-0">
            {[
              { n: '01', icon: <Package size={32} />, title: 'Explora el Catálogo', desc: 'Navega por más de 100 props clasificados por categoría. Descarga imágenes de alta resolución para tus moodboards.' },
              { n: '02', icon: <Clock size={32} />, title: 'Arma tu Cotización', desc: 'Agrega los props que necesitas a tu carrito, selecciona las fechas de renta y el sistema calculará el costo total.' },
              { n: '03', icon: <Star size={32} />, title: 'Confirma tu Pedido', desc: 'Envía tu solicitud y nuestro equipo confirmará disponibilidad y te enviará la cotización formal por email.' }
            ].map((s, i) => (
              <div key={i} className={`p-8 ${i < 2 ? 'border-b-4 md:border-b-0 md:border-r-4 border-black' : ''}`}>
                <div className="flex items-start gap-4">
                  <span className="font-heading text-5xl font-black text-black opacity-20">{s.n}</span>
                  <div>
                    <div className="bg-[#ffc832] border-4 border-black p-3 w-fit mb-4 shadow-brutal-sm">
                      {s.icon}
                    </div>
                    <h3 className="font-heading text-xl font-black uppercase mb-3">{s.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section id="sobre-nosotros" className="border-b-4 border-black py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-4xl font-black uppercase text-[#ffc832] mb-6">Sobre Hangar</h2>
              <p className="text-white text-lg leading-relaxed mb-6">
                Somos el aliado estratégico de las agencias de publicidad y directores de arte más exigentes de México. Con más de 10 años rentando props de alta calidad para producciones audiovisuales.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Nuestro catálogo incluye muebles de época, decoración contemporánea, iluminación vintage y arte original. Cada pieza está cuidadosamente seleccionada y mantenida para garantizar el mejor resultado visual en tu producción.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Agencias Colaboradoras', value: '50+' },
                { label: 'Producciones Anuales', value: '200+' },
                { label: 'Piezas en Catálogo', value: '100+' },
                { label: 'Años de Experiencia', value: '10+' }
              ].map((s, i) => (
                <div key={i} className="bg-[#ffc832] border-4 border-[#ffc832] p-6 shadow-[6px_6px_0px_0px_rgba(255,230,0,0.3)]">
                  <div className="font-heading text-3xl font-black text-black">{s.value}</div>
                  <div className="text-xs font-bold text-black uppercase tracking-wide mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-heading text-4xl font-black uppercase text-black mb-4">¿Listo para tu próxima producción?</h2>
          <p className="text-lg text-black mb-8 max-w-xl mx-auto">Crea tu cuenta, explora el catálogo y envíanos tu cotización. Respondemos en menos de 24 horas.</p>
          <Link href="/catalogo" className="btn-brutal inline-flex items-center gap-2 text-lg">
            Explorar Catálogo <ArrowRight size={22} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="sr-only">HANGAR</span>
            <Image
              src="/assets/logos/Hangar-logo-amarillo.png"
              alt="HANGAR"
              width={180}
              height={48}
              className="hidden sm:block h-10 w-auto"
            />
            <Image
              src="/assets/logos/amarillo-vert.png"
              alt="HANGAR"
              width={64}
              height={64}
              className="block sm:hidden h-10 w-auto"
            />
          </div>
          <p className="text-sm text-gray-400">Props para producciones publicitarias · Perú</p>
          <div className="flex gap-6 text-sm font-bold">
            <Link href="/catalogo" className="text-[#ffc832] hover:underline">Catálogo</Link>
            <Link href="/mi-cuenta" className="text-[#ffc832] hover:underline">Mi Cuenta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


