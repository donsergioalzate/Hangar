'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, FileText, Users, LayoutGrid, Clock, CheckCircle, RotateCcw, TrendingUp, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const STATUS_MAP = {
    NEW: { label: 'Nueva', color: 'bg-blue-500 text-white', icon: <Clock size={12} /> },
    CONFIRMED: { label: 'Confirmada', color: 'bg-green-500 text-white', icon: <CheckCircle size={12} /> },
    RETURNED: { label: 'Devuelta', color: 'bg-gray-500 text-white', icon: <RotateCcw size={12} /> }
  };

  return (
    <div className="p-8">
      <div className="mb-10">
        <h1 className="font-heading text-5xl font-black uppercase text-black">Dashboard</h1>
        <p className="text-gray-700 font-medium mt-1">Resumen general de Hangar</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card-brutal h-28 animate-pulse" />)}
        </div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Total Props', value: stats.totalProps, icon: <Package size={24} />, color: 'bg-[#ffc832]', link: '/dashboard/inventario' },
              { label: 'Categorías', value: stats.totalCategories, icon: <LayoutGrid size={24} />, color: 'bg-white', link: '/dashboard/inventario' },
              { label: 'Usuarios', value: stats.totalUsers, icon: <Users size={24} />, color: 'bg-white', link: null },
              { label: 'Cotiz. Nuevas', value: stats.newQuotes, icon: <Clock size={24} />, color: 'bg-blue-100', link: '/dashboard/cotizaciones?status=NEW' },
              { label: 'Confirmadas', value: stats.confirmedQuotes, icon: <CheckCircle size={24} />, color: 'bg-green-100', link: '/dashboard/cotizaciones?status=CONFIRMED' },
              { label: 'Devueltas', value: stats.returnedQuotes, icon: <RotateCcw size={24} />, color: 'bg-gray-100', link: '/dashboard/cotizaciones?status=RETURNED' }
            ].map((s, i) => (
              <div key={i} className={`card-brutal p-6 ${s.color} ${s.link ? 'hover:shadow-brutal-xs hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer' : ''}`}>
                {s.link ? (
                  <Link href={s.link} className="block">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-black uppercase text-gray-600 mb-1">{s.label}</p>
                        <p className="font-heading text-4xl font-black text-black">{s.value}</p>
                      </div>
                      <div className="opacity-30">{s.icon}</div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600 mb-1">{s.label}</p>
                      <p className="font-heading text-4xl font-black text-black">{s.value}</p>
                    </div>
                    <div className="opacity-30">{s.icon}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <hr className="border-t-4 border-black mb-8" />

          {/* Recent Quotes */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-2xl font-black uppercase">Cotizaciones Recientes</h2>
                <Link href="/dashboard/cotizaciones" className="text-sm font-bold underline decoration-2 flex items-center gap-1">
                  Ver todas <ArrowRight size={14} />
                </Link>
              </div>
              {stats.recentQuotes?.length === 0 ? (
                <div className="card-brutal p-8 text-center">
                  <FileText size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-bold text-gray-500 text-sm">No hay cotizaciones aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentQuotes.map(q => {
                    const st = STATUS_MAP[q.status] || STATUS_MAP.NEW;
                    return (
                      <Link key={q.id} href="/dashboard/cotizaciones" className="card-brutal p-4 flex items-center justify-between hover:shadow-brutal-xs hover:translate-x-[2px] hover:translate-y-[2px] transition-all block">
                        <div>
                          <p className="font-heading font-black">{q.folio}</p>
                          <p className="text-xs text-gray-500">{q.userName} · {q.userProductionCompany}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm">S/ {q.totalCost?.toLocaleString('es-PE')}</span>
                          <span className={`flex items-center gap-1 text-xs font-black uppercase px-2 py-1 border border-black ${st.color}`}>
                            {st.icon} {st.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="font-heading text-2xl font-black uppercase mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                {[
                  { href: '/dashboard/inventario', label: 'Agregar nuevo prop', icon: <Package size={18} />, desc: 'Crea un nuevo prop en el catálogo' },
                  { href: '/dashboard/cotizaciones', label: 'Gestionar cotizaciones', icon: <FileText size={18} />, desc: 'Revisa y confirma solicitudes' },
                  { href: '/dashboard/emails', label: 'Emails BCC', icon: <TrendingUp size={18} />, desc: 'Administra emails de notificación' },
                  { href: '/catalogo', label: 'Ver catálogo público', icon: <ArrowRight size={18} />, desc: 'Vista previa del sitio público' }
                ].map((a, i) => (
                  <Link key={i} href={a.href} className="card-brutal p-4 flex items-center gap-4 hover:shadow-brutal-xs hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    <div className="bg-[#ffc832] border-2 border-black p-2 flex-shrink-0 shadow-brutal-xs">
                      {a.icon}
                    </div>
                    <div>
                      <p className="font-black uppercase text-sm">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card-brutal p-8 text-center">
          <p className="font-bold text-gray-500">Error al cargar las estadísticas</p>
        </div>
      )}
    </div>
  );
}

