'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useCart } from '@/components/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, Package, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';

export default function CarritoPage() {
  const { items, startDate, endDate, totalDays, totalCost, itemCount, removeItem, updateQuantity, updateDates, initialized } = useCart();
  const [stockWarnings, setStockWarnings] = useState({});

  // Check stock overlaps when dates change
  useEffect(() => {
    if (!startDate || !endDate || items.length === 0) return;
    const params = new URLSearchParams({ startDate, endDate });
    fetch(`/api/props?${params}`)
      .then(r => r.json())
      .then(props => {
        const warnings = {};
        (props || []).forEach(p => {
          if (p.hasStockWarning) warnings[p.id] = true;
        });
        setStockWarnings(warnings);
      })
      .catch(() => {});
  }, [startDate, endDate, items]);

  if (!initialized) return null;

  const isDateValid = startDate && endDate && new Date(endDate) >= new Date(startDate);

  return (
    <div className="min-h-screen bg-[#ffc832]">
      <Navbar />

      {/* Header */}
      <div className="border-b-4 border-black bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl font-black uppercase text-black">Mi Carrito</h1>
            <p className="text-gray-600 font-medium">{itemCount} {itemCount === 1 ? 'prop' : 'props'} seleccionados</p>
          </div>
          <ShoppingCart size={40} className="text-black opacity-20" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="card-brutal p-16 text-center max-w-lg mx-auto">
            <ShoppingCart size={60} className="mx-auto mb-6 text-gray-300" />
            <h2 className="font-heading text-3xl font-black uppercase mb-4">Carrito vacío</h2>
            <p className="text-gray-500 mb-8">Agrega props desde el catálogo para comenzar tu cotización.</p>
            <Link href="/catalogo" className="btn-brutal inline-flex items-center gap-2">
              <Package size={18} /> Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,380px] gap-8">

            {/* ITEMS LIST */}
            <div className="space-y-4">
              {/* DATE RANGE — Top of cart */}
              <div className="card-brutal p-6">
                <h2 className="font-heading font-black uppercase text-lg mb-4 flex items-center gap-2">
                  <Calendar size={20} /> Período de Renta
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase block mb-2">Fecha de Inicio *</label>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => updateDates(e.target.value, endDate)}
                      className="input-brutal"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase block mb-2">Fecha de Fin *</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      onChange={e => updateDates(startDate, e.target.value)}
                      className="input-brutal"
                    />
                  </div>
                </div>
                {!startDate || !endDate ? (
                  <p className="text-xs text-red-600 font-bold mt-3 flex items-center gap-1">
                    <AlertTriangle size={14} /> Debes seleccionar las fechas para continuar
                  </p>
                ) : !isDateValid ? (
                  <p className="text-xs text-red-600 font-bold mt-3 flex items-center gap-1">
                    <AlertTriangle size={14} /> La fecha de fin debe ser igual o posterior al inicio
                  </p>
                ) : (
                  <p className="text-xs text-green-700 font-bold mt-3 bg-green-50 border-2 border-green-500 px-3 py-2">
                    ✓ {totalDays} {totalDays === 1 ? 'día' : 'días'} de renta seleccionados
                  </p>
                )}
              </div>

              <hr className="border-t-4 border-black" />

              {/* Items */}
              {items.map(item => (
                <div key={item.propId} className={`card-brutal p-4 flex gap-4 ${stockWarnings[item.propId] ? 'border-orange-500' : ''}`}>
                  {/* Image */}
                  <div className="w-20 h-20 flex-shrink-0 border-2 border-black overflow-hidden bg-gray-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.propName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#ffc832] flex items-center justify-center">
                        <Package size={24} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-heading font-black text-sm uppercase line-clamp-2">{item.propName}</h3>
                        {item.dimensions && <p className="text-xs text-gray-500">{item.dimensions}</p>}
                        {stockWarnings[item.propId] && (
                          <p className="text-xs text-orange-600 font-bold flex items-center gap-1 mt-1">
                            <AlertTriangle size={12} /> Por confirmar stock para las fechas
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.propId)}
                        className="flex-shrink-0 p-1 hover:bg-red-100 text-red-600 border-2 border-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center border-2 border-black">
                        <button
                          onClick={() => updateQuantity(item.propId, item.quantity - 1)}
                          className="px-2 py-1 border-r-2 border-black hover:bg-black hover:text-[#ffc832] transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-4 py-1 font-black text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.propId, item.quantity + 1)}
                          className="px-2 py-1 border-l-2 border-black hover:bg-black hover:text-[#ffc832] transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500">${item.pricePerDay?.toLocaleString('es-MX')}/día × {item.quantity} × {totalDays}d</p>
                        <p className="font-black text-lg">${(item.pricePerDay * item.quantity * totalDays).toLocaleString('es-MX')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ORDER SUMMARY */}
            <div className="space-y-4">
              <div className="card-brutal p-6">
                <h2 className="font-heading font-black uppercase text-xl mb-6 border-b-4 border-black pb-4">Resumen</h2>

                <div className="space-y-3 mb-6">
                  {items.map(item => (
                    <div key={item.propId} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1 mr-2">{item.propName} ×{item.quantity}</span>
                      <span className="font-bold flex-shrink-0">${(item.pricePerDay * item.quantity * totalDays).toLocaleString('es-MX')}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-4 border-black pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Días de renta</span>
                    <span className="font-bold">{isDateValid ? totalDays : '—'}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-black uppercase">TOTAL</span>
                    <span className="font-heading text-3xl font-black">${isDateValid ? totalCost.toLocaleString('es-MX') : '—'}</span>
                  </div>
                  <p className="text-xs text-gray-500">SOLES · Precio sujeto a disponibilidad</p>
                </div>

                <Link
                  href="/checkout"
                  className={`mt-6 w-full flex items-center justify-center gap-2 text-lg py-4 border-4 border-black font-black uppercase transition-all ${isDateValid ? 'bg-black text-[#ffc832] shadow-brutal hover:shadow-brutal-xs hover:translate-x-[4px] hover:translate-y-[4px]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  onClick={e => !isDateValid && e.preventDefault()}
                >
                  Solicitar Cotización <ArrowRight size={20} />
                </Link>

                {!isDateValid && (
                  <p className="text-xs text-center text-red-600 font-bold mt-2">Selecciona las fechas de renta para continuar</p>
                )}
              </div>

              <Link href="/catalogo" className="btn-brutal-outline w-full flex items-center justify-center gap-2">
                <Package size={18} /> Seguir viendo catálogo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

