'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Package, Save, Toggle, Eye, EyeOff } from 'lucide-react';

const EMPTY_PROP = { name: '', dimensions: '', description: '', pricePerDay: '', categoryId: '', images: [''], stockOverride: false };
const EMPTY_CAT = { name: '' };

export default function InventarioPage() {
  const [props, setProps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('props');

  // Prop form state
  const [showPropForm, setShowPropForm] = useState(false);
  const [editingProp, setEditingProp] = useState(null);
  const [propForm, setPropForm] = useState(EMPTY_PROP);
  const [propLoading, setPropLoading] = useState(false);
  const [propError, setPropError] = useState('');

  // Category form state
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([fetch('/api/props'), fetch('/api/categories')]);
    const [p, c] = await Promise.all([pRes.json(), cRes.json()]);
    setProps(Array.isArray(p) ? p : []);
    setCategories(Array.isArray(c) ? c : []);
    setLoading(false);
  };

  // === PROPS ===
  const openPropCreate = () => {
    setEditingProp(null);
    setPropForm(EMPTY_PROP);
    setPropError('');
    setShowPropForm(true);
  };

  const openPropEdit = (prop) => {
    setEditingProp(prop);
    setPropForm({
      name: prop.name,
      dimensions: prop.dimensions || '',
      description: prop.description || '',
      pricePerDay: prop.pricePerDay,
      categoryId: prop.categoryId || '',
      images: prop.images?.map(i => i.url) || [''],
      stockOverride: prop.stockOverride || false
    });
    setPropError('');
    setShowPropForm(true);
  };

  const saveProp = async (e) => {
    e.preventDefault();
    const validImages = propForm.images.filter(u => u.trim());
    if (validImages.length === 0) { setPropError('Agrega al menos una imagen'); return; }
    if (validImages.length > 5) { setPropError('Máximo 5 imágenes'); return; }
    setPropLoading(true);
    setPropError('');
    try {
      const body = { ...propForm, images: validImages.map((url, i) => ({ url, isMain: i === 0 })) };
      const method = editingProp ? 'PUT' : 'POST';
      const url = editingProp ? `/api/props/${editingProp.id}` : '/api/props';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); setPropError(d.error || 'Error'); return; }
      setShowPropForm(false);
      fetchAll();
    } catch (e) {
      setPropError('Error de conexión');
    } finally {
      setPropLoading(false);
    }
  };

  const deleteProp = async (id) => {
    if (!confirm('¿Eliminar este prop?')) return;
    await fetch(`/api/props/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const toggleStock = async (prop) => {
    await fetch(`/api/props/${prop.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockOverride: !prop.stockOverride })
    });
    fetchAll();
  };

  const addImageField = () => {
    if (propForm.images.length >= 5) return;
    setPropForm(p => ({ ...p, images: [...p.images, ''] }));
  };
  const removeImageField = (i) => {
    setPropForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
  };
  const updateImageField = (i, val) => {
    setPropForm(p => ({ ...p, images: p.images.map((url, idx) => idx === i ? val : url) }));
  };

  // === CATEGORIES ===
  const openCatCreate = () => { setEditingCat(null); setCatForm(EMPTY_CAT); setShowCatForm(true); };
  const openCatEdit = (cat) => { setEditingCat(cat); setCatForm({ name: cat.name }); setShowCatForm(true); };
  const saveCat = async (e) => {
    e.preventDefault();
    setCatLoading(true);
    try {
      const method = editingCat ? 'PUT' : 'POST';
      const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) });
      setShowCatForm(false);
      fetchAll();
    } catch (e) {} finally { setCatLoading(false); }
  };
  const deleteCat = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const getCatName = (id) => categories.find(c => c.id === id)?.name || '—';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-5xl font-black uppercase text-black">Inventario</h1>
          <p className="text-gray-700 font-medium">{props.length} props · {categories.length} categorías</p>
        </div>
        <button
          onClick={activeTab === 'props' ? openPropCreate : openCatCreate}
          className="btn-brutal flex items-center gap-2"
        >
          <Plus size={18} /> Agregar {activeTab === 'props' ? 'Prop' : 'Categoría'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-4 border-black mb-8 shadow-brutal w-fit">
        <button
          onClick={() => setActiveTab('props')}
          className={`px-6 py-3 font-black uppercase text-sm border-r-2 border-black transition-colors ${activeTab === 'props' ? 'bg-black text-[#ffc832]' : 'bg-[#ffc832] text-black hover:bg-white'}`}
        >
          Props ({props.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3 font-black uppercase text-sm transition-colors ${activeTab === 'categories' ? 'bg-black text-[#ffc832]' : 'bg-[#ffc832] text-black hover:bg-white'}`}
        >
          Categorías ({categories.length})
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card-brutal h-40 animate-pulse" />)}
        </div>
      ) : activeTab === 'props' ? (
        <>
          {props.length === 0 ? (
            <div className="card-brutal p-12 text-center">
              <Package size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-gray-500">No hay props. Crea el primero.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-4 border-black">
                <thead>
                  <tr className="bg-black text-[#ffc832]">
                    <th className="text-left px-4 py-3 font-black uppercase text-xs border-r-2 border-[#ffc832]">Prop</th>
                    <th className="text-left px-4 py-3 font-black uppercase text-xs border-r-2 border-[#ffc832] hidden md:table-cell">Categoría</th>
                    <th className="text-right px-4 py-3 font-black uppercase text-xs border-r-2 border-[#ffc832]">$/Día</th>
                    <th className="text-center px-4 py-3 font-black uppercase text-xs border-r-2 border-[#ffc832]">Stock</th>
                    <th className="text-center px-4 py-3 font-black uppercase text-xs">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map((prop, i) => (
                    <tr key={prop.id} className={`border-b-2 border-black ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-[#ffc832]/30 transition-colors`}>
                      <td className="px-4 py-3 border-r-2 border-black">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex-shrink-0 border-2 border-black overflow-hidden bg-gray-100">
                            {prop.images?.[0]?.url ? (
                              <img src={prop.images[0].url} alt={prop.name} className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full bg-[#ffc832]" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{prop.name}</p>
                            <p className="text-xs text-gray-500">{prop.dimensions}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r-2 border-black text-sm hidden md:table-cell">{getCatName(prop.categoryId)}</td>
                      <td className="px-4 py-3 border-r-2 border-black text-right font-black">${prop.pricePerDay?.toLocaleString('es-MX')}</td>
                      <td className="px-4 py-3 border-r-2 border-black text-center">
                        <button
                          onClick={() => toggleStock(prop)}
                          title={prop.stockOverride ? 'Stock OK (click para quitar override)' : 'Sin override (click para marcar stock OK)'}
                          className={`inline-flex items-center gap-1 px-2 py-1 border-2 border-black text-xs font-bold transition-colors ${prop.stockOverride ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#ffc832]'}`}
                        >
                          {prop.stockOverride ? <><Eye size={12} /> OK</> : <><EyeOff size={12} /> —</>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openPropEdit(prop)} className="p-1.5 border-2 border-black hover:bg-[#ffc832] transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteProp(prop.id)} className="p-1.5 border-2 border-black hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* CATEGORIES */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <div className="card-brutal p-8 text-center col-span-3">
              <p className="font-bold text-gray-500">No hay categorías</p>
            </div>
          ) : categories.map(cat => (
            <div key={cat.id} className="card-brutal p-4 flex items-center justify-between">
              <span className="font-heading font-black uppercase">{cat.name}</span>
              <div className="flex gap-2">
                <button onClick={() => openCatEdit(cat)} className="p-1.5 border-2 border-black hover:bg-[#ffc832] transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => deleteCat(cat.id)} className="p-1.5 border-2 border-black hover:bg-red-500 hover:text-white transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROP FORM MODAL */}
      {showPropForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-8 px-4 overflow-y-auto">
          <div className="card-brutal w-full max-w-2xl mb-8">
            <div className="flex items-center justify-between p-6 border-b-4 border-black bg-[#ffc832]">
              <h2 className="font-heading font-black text-xl uppercase">{editingProp ? 'Editar Prop' : 'Nuevo Prop'}</h2>
              <button onClick={() => setShowPropForm(false)} className="p-1 hover:bg-black/10"><X size={20} /></button>
            </div>
            <form onSubmit={saveProp} className="p-6 space-y-4">
              {propError && <div className="bg-red-100 border-2 border-red-500 p-3 text-sm font-bold text-red-700">{propError}</div>}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase block mb-1">Nombre *</label>
                  <input required value={propForm.name} onChange={e => setPropForm(p => ({ ...p, name: e.target.value }))} className="input-brutal" placeholder="Nombre del prop" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-1">Precio por Día (MXN) *</label>
                  <input required type="number" min="0" value={propForm.pricePerDay} onChange={e => setPropForm(p => ({ ...p, pricePerDay: e.target.value }))} className="input-brutal" placeholder="1200" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-1">Categoría</label>
                  <select value={propForm.categoryId} onChange={e => setPropForm(p => ({ ...p, categoryId: e.target.value }))} className="input-brutal">
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase block mb-1">Dimensiones</label>
                  <input value={propForm.dimensions} onChange={e => setPropForm(p => ({ ...p, dimensions: e.target.value }))} className="input-brutal" placeholder="90 x 80 x 100 cm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase block mb-1">Descripción</label>
                  <textarea value={propForm.description} onChange={e => setPropForm(p => ({ ...p, description: e.target.value }))} className="input-brutal resize-none" rows={3} placeholder="Descripción del prop..." />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase">URLs de Imágenes (máx. 5)</label>
                    <button type="button" onClick={addImageField} disabled={propForm.images.length >= 5} className="text-xs font-bold border-2 border-black px-2 py-1 hover:bg-[#ffc832] disabled:opacity-40">
                      + Agregar
                    </button>
                  </div>
                  {propForm.images.map((url, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={url} onChange={e => updateImageField(i, e.target.value)} className="input-brutal flex-1" placeholder={`URL imagen ${i + 1}${i === 0 ? ' (principal)' : ''}`} />
                      {propForm.images.length > 1 && (
                        <button type="button" onClick={() => removeImageField(i)} className="p-2 border-2 border-black hover:bg-red-100">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">La primera imagen será la principal.</p>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="stockOverride" checked={propForm.stockOverride} onChange={e => setPropForm(p => ({ ...p, stockOverride: e.target.checked }))} className="w-5 h-5 border-2 border-black" />
                  <label htmlFor="stockOverride" className="text-sm font-bold cursor-pointer">
                    Override de Stock (marca como disponible aunque haya conflicto de fechas)
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t-4 border-black">
                <button type="submit" disabled={propLoading} className="btn-brutal flex items-center gap-2 flex-1 justify-center">
                  <Save size={16} /> {propLoading ? 'Guardando...' : 'Guardar Prop'}
                </button>
                <button type="button" onClick={() => setShowPropForm(false)} className="btn-brutal-white flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY FORM MODAL */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="card-brutal w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b-4 border-black bg-[#ffc832]">
              <h2 className="font-heading font-black uppercase">{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button onClick={() => setShowCatForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={saveCat} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-black uppercase block mb-1">Nombre *</label>
                <input required value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} className="input-brutal" placeholder="Nombre de la categoría" />
              </div>
              <div className="flex gap-3 border-t-4 border-black pt-4">
                <button type="submit" disabled={catLoading} className="btn-brutal flex-1">{catLoading ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={() => setShowCatForm(false)} className="btn-brutal-white flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

