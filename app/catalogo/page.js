'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useCart } from '@/components/CartContext';
import { Package, Search, Filter, ShoppingCart, AlertTriangle, ChevronRight, X } from 'lucide-react';

export default function CatalogoPage() {
  const [props, setProps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [addedMap, setAddedMap] = useState({});
  const { addItem, startDate, endDate } = useCart();

  const fetchProps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (search) params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/props?${params}`);
      const data = await res.json();
      setProps(Array.isArray(data) ? data : []);
    } catch (e) {
      setProps([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search, startDate, endDate]);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProps, 300);
    return () => clearTimeout(timer);
  }, [fetchProps]);

  const handleAdd = (prop) => {
    addItem(prop);
    setAddedMap(prev => ({ ...prev, [prop.id]: true }));
    setTimeout(() => setAddedMap(prev => ({ ...prev, [prop.id]: false })), 1500);
  };

  return (
    <div className="min-h-screen bg-[#ffc832]">
      <Navbar />

      {/* Header */}
      <div className="border-b-4 border-black bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-5xl font-black uppercase text-black mb-2">Catálogo</h1>
          <p className="text-gray-600 font-medium">Explora nuestra colección de props para producción</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[280px,1fr] gap-8">

          {/* SIDEBAR FILTERS */}
          <aside className="space-y-4">
            {/* Search */}
            <div className="card-brutal p-4">
              <h3 className="font-heading font-black uppercase text-sm mb-3 flex items-center gap-2">
                <Search size={16} /> Buscar
              </h3>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nombre del prop..."
                  className="input-brutal pr-10"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="card-brutal p-4">
              <h3 className="font-heading font-black uppercase text-sm mb-3 flex items-center gap-2">
                <Filter size={16} /> Fechas de Renta
              </h3>
              <p className="text-xs text-gray-500 mb-3">Selecciona fechas para ver disponibilidad</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">Inicio</label>
                  <input type="date" className="input-brutal text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">Fin</label>
                  <input type="date" className="input-brutal text-sm" />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="card-brutal p-4">
              <h3 className="font-heading font-black uppercase text-sm mb-3">Categorías</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 font-bold text-sm uppercase border-2 border-black transition-all ${!selectedCategory ? 'bg-black text-[#ffc832]' : 'bg-white text-black hover:bg-[#ffc832]'}`}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 font-bold text-sm uppercase border-2 border-black transition-all ${selectedCategory === cat.id ? 'bg-black text-[#ffc832]' : 'bg-white text-black hover:bg-[#ffc832]'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* PROPS GRID */}
          <main>
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="font-bold text-sm text-black uppercase">
                {loading ? 'Cargando...' : `${props.length} props encontrados`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-brutal animate-pulse">
                    <div className="aspect-square bg-gray-200 border-b-4 border-black" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 w-3/4" />
                      <div className="h-3 bg-gray-200 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : props.length === 0 ? (
              <div className="card-brutal p-16 text-center">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="font-heading text-2xl font-black uppercase mb-2">Sin resultados</h3>
                <p className="text-gray-500">
                  {categories.length === 0
                    ? 'No hay props cargados. Usa el botón "Cargar Demo" en la página principal.'
                    : 'No se encontraron props con ese criterio.'}
                </p>
                {(search || selectedCategory) && (
                  <button
                    onClick={() => { setSearch(''); setSelectedCategory(''); }}
                    className="btn-brutal mt-4 text-sm"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {props.map(prop => (
                  <div key={prop.id} className="group card-brutal overflow-hidden flex flex-col">
                    {/* Image */}
                    <Link href={`/catalogo/${prop.id}`} className="block relative border-b-4 border-black">
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        {prop.images?.[0]?.url ? (
                          <img
                            src={prop.images[0].url}
                            alt={prop.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#ffc832] flex items-center justify-center">
                            <Package size={40} />
                          </div>
                        )}
                      </div>
                      {/* Stock warning badge */}
                      {prop.hasStockWarning && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white border-2 border-black px-2 py-1 text-xs font-black flex items-center gap-1 shadow-brutal-xs">
                          <AlertTriangle size={12} />
                          Por confirmar stock
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <Link href={`/catalogo/${prop.id}`} className="hover:underline">
                        <h3 className="font-heading font-black uppercase text-sm mb-1 line-clamp-2">{prop.name}</h3>
                      </Link>
                      <p className="text-xs text-gray-500 mb-3">{prop.dimensions}</p>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <span className="font-black text-lg">
                          S/ {prop.pricePerDay?.toLocaleString('es-PE')}
                          <span className="text-xs font-normal text-gray-500">/día</span>
                        </span>
                        <button
                          onClick={() => handleAdd(prop)}
                          className={`flex items-center gap-1 px-3 py-2 border-2 border-black font-bold text-xs uppercase transition-all shadow-brutal-xs hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${addedMap[prop.id] ? 'bg-green-500 text-white border-green-600' : 'bg-black text-[#ffc832]'}`}
                        >
                          {addedMap[prop.id] ? '✓ Agregado' : <><ShoppingCart size={14} /> Agregar</>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

