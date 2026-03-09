'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useCart } from '@/components/CartContext';
import { Package, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, startDate, endDate, totalDays, totalCost, clearCart, initialized } = useCart();

  const [form, setForm] = useState({ name: '', email: '', phone: '', productionCompany: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user) {
      setForm(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        productionCompany: session.user.productionCompany || ''
      }));
    }
  }, [session]);

  if (!initialized) return null;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FFE600]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="font-heading text-2xl font-black animate-pulse">Cargando...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#FFE600]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="card-brutal p-10 text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-orange-500" />
            <h2 className="font-heading text-3xl font-black uppercase mb-4">Inicia Sesión</h2>
            <p className="text-gray-600 mb-8">Debes iniciar sesión para enviar tu cotización.</p>
            <Link href="/mi-cuenta?redirect=/checkout" className="btn-brutal inline-flex items-center gap-2">
              Iniciar Sesión <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-[#FFE600]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="card-brutal p-10 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="font-heading text-3xl font-black uppercase mb-4">Carrito vacío</h2>
            <Link href="/catalogo" className="btn-brutal inline-flex items-center gap-2">
              <ArrowLeft size={18} /> Ir al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FFE600]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="card-brutal p-10 text-center">
            <CheckCircle size={64} className="mx-auto mb-6 text-green-500" />
            <h2 className="font-heading text-4xl font-black uppercase mb-3">¡Cotización Enviada!</h2>
            <div className="bg-[#FFE600] border-4 border-black p-4 mb-6 shadow-brutal-sm">
              <p className="text-xs font-black uppercase text-gray-600">Folio</p>
              <p className="font-heading text-3xl font-black">{success.folio}</p>
            </div>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              Tu cotización ha sido recibida. Nuestro equipo revisará la disponibilidad y te contactará en las próximas 24 horas.
            </p>
            <div className="space-y-3">
              <Link href="/mi-cuenta" className="btn-brutal w-full flex items-center justify-center gap-2">
                Ver Mis Cotizaciones
              </Link>
              <Link href="/catalogo" className="btn-brutal-outline w-full flex items-center justify-center gap-2">
                Seguir Explorando
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Nombre y email son requeridos'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate, notes: form.notes,
          items: items.map(item => ({
            propId: item.propId, propName: item.propName,
            dimensions: item.dimensions, pricePerDay: item.pricePerDay, quantity: item.quantity
          })),
          userName: form.name, userEmail: form.email,
          userPhone: form.phone, userProductionCompany: form.productionCompany
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al crear la cotización'); return; }
      clearCart();
      setSuccess(data);
    } catch (e) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFE600]">
      <Navbar />

      {/* Header */}
      <div className="border-b-4 border-black bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-4xl font-black uppercase text-black">Solicitar Cotización</h1>
          <p className="text-gray-600 font-medium">Confirma tus datos y envía la solicitud</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8">

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card-brutal p-6">
              <h2 className="font-heading font-black uppercase text-xl mb-6 border-b-4 border-black pb-4">
                Datos de Contacto
              </h2>
              <p className="text-xs text-gray-500 mb-4">Estos campos se llenan automáticamente con tu perfil. Puedes editarlos para esta cotización sin cambiar tu cuenta.</p>

              {error && (
                <div className="bg-red-100 border-4 border-red-500 p-4 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <p className="text-red-700 font-bold text-sm">{error}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase block mb-2">Nombre Completo *</label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-brutal"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-2">Email *</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="input-brutal"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-2">Teléfono</label>
                  <input
                    type="tel" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="input-brutal"
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-2">Empresa / Productora</label>
                  <input
                    type="text" value={form.productionCompany}
                    onChange={e => setForm(p => ({ ...p, productionCompany: e.target.value }))}
                    className="input-brutal"
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>
            </div>

            <div className="card-brutal p-6">
              <h2 className="font-heading font-black uppercase text-xl mb-4 border-b-4 border-black pb-4">
                Notas Adicionales
              </h2>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Información adicional sobre el proyecto, condiciones especiales de entrega, preguntas sobre los props..."
                rows={4}
                className="input-brutal resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-brutal w-full flex items-center justify-center gap-3 text-lg py-4 disabled:opacity-60"
            >
              {loading ? 'Enviando...' : <><ArrowRight size={20} /> Enviar Cotización</>}
            </button>
          </form>

          {/* SUMMARY */}
          <div className="space-y-4">
            <div className="card-brutal p-6">
              <h2 className="font-heading font-black uppercase text-xl mb-4 border-b-4 border-black pb-4">Resumen del Pedido</h2>

              {/* Dates */}
              <div className="bg-[#FFE600] border-2 border-black p-3 mb-4">
                <p className="text-xs font-black uppercase text-gray-600">Período</p>
                <p className="font-bold">{startDate} → {endDate}</p>
                <p className="text-sm font-black mt-1">{totalDays} {totalDays === 1 ? 'día' : 'días'}</p>
              </div>

              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.propId} className="flex gap-3">
                    <div className="w-12 h-12 flex-shrink-0 border-2 border-black overflow-hidden bg-gray-100">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.propName} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full bg-[#FFE600]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs uppercase truncate">{item.propName}</p>
                      <p className="text-xs text-gray-500">×{item.quantity} · ${item.pricePerDay?.toLocaleString()}/día</p>
                      <p className="text-xs font-black">${(item.pricePerDay * item.quantity * totalDays).toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-4 border-black pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-black uppercase text-lg">TOTAL ESTIMADO</span>
                  <span className="font-heading text-3xl font-black">${totalCost.toLocaleString('es-MX')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">MXN · El precio final será confirmado por nuestro equipo</p>
              </div>
            </div>

            <Link href="/carrito" className="btn-brutal-outline w-full flex items-center justify-center gap-2 text-sm">
              <ArrowLeft size={16} /> Modificar carrito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
