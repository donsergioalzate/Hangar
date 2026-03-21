'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Mail } from 'lucide-react';

const DEPARTMENTS = ['Bodega', 'Contabilidad'];

export default function EmailsPage() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', department: 'Bodega' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchEmails = async () => {
    setLoading(true);
    const res = await fetch('/api/hidden-emails');
    const data = await res.json();
    setEmails(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchEmails(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.email) { setError('El email es requerido'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/hidden-emails', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      setShowForm(false);
      setForm({ email: '', department: 'Bodega' });
      fetchEmails();
    } catch (e) { setError('Error de conexión'); }
    finally { setSaving(false); }
  };

  const deleteEmail = async (id) => {
    if (!confirm('¿Eliminar este email?')) return;
    await fetch(`/api/hidden-emails/${id}`, { method: 'DELETE' });
    fetchEmails();
  };

  const byDept = DEPARTMENTS.reduce((acc, d) => {
    acc[d] = emails.filter(e => e.department === d);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-5xl font-black uppercase text-black">Emails Ocultos</h1>
          <p className="text-gray-700 font-medium">Emails BCC para notificaciones de cotizaciones</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }} className="btn-brutal flex items-center gap-2">
          <Plus size={18} /> Agregar Email
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-white border-4 border-black p-5 mb-8 shadow-brutal">
        <div className="flex items-start gap-3">
          <Mail size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black uppercase text-sm mb-1">¿Para qué sirven?</p>
            <p className="text-sm text-gray-700">
              Cuando una cotización se confirme y el sistema de email esté habilitado, todos los emails de esta lista recibirán una copia BCC del PDF de cotización automáticamente.
              Se organizan por departamento para facilitar la gestión.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="card-brutal h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {DEPARTMENTS.map(dept => (
            <div key={dept} className="card-brutal overflow-hidden">
              <div className="bg-black text-[#ffc832] px-5 py-3 border-b-4 border-black flex items-center justify-between">
                <h2 className="font-heading font-black uppercase">{dept}</h2>
                <span className="text-sm font-black">{byDept[dept].length} emails</span>
              </div>
              <div className="divide-y-2 divide-gray-200">
                {byDept[dept].length === 0 ? (
                  <div className="p-6 text-center">
                    <Mail size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500 font-medium">Sin emails para {dept}</p>
                  </div>
                ) : byDept[dept].map(e => (
                  <div key={e.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#ffc832]/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <span className="font-medium text-sm">{e.email}</span>
                    </div>
                    <button
                      onClick={() => deleteEmail(e.id)}
                      className="p-1.5 border-2 border-black hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All emails summary */}
      {emails.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading font-black uppercase text-xl mb-4">Todos los Emails</h2>
          <div className="card-brutal overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-black text-[#ffc832]">
                  <th className="text-left px-4 py-3 text-xs font-black uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase">Departamento</th>
                  <th className="text-center px-4 py-3 text-xs font-black uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((e, i) => (
                  <tr key={e.id} className={`border-b-2 border-black ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-sm">{e.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-black uppercase bg-[#ffc832] border-2 border-black px-2 py-0.5">{e.department}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => deleteEmail(e.id)} className="p-1.5 border-2 border-black hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="card-brutal w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b-4 border-black bg-[#ffc832]">
              <h2 className="font-heading font-black uppercase">Agregar Email BCC</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="bg-red-100 border-2 border-red-500 p-3 text-sm font-bold text-red-700">{error}</div>}
              <div>
                <label className="text-xs font-black uppercase block mb-2">Dirección de Email *</label>
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-brutal" placeholder="ejemplo@empresa.mx"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase block mb-2">Departamento *</label>
                <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="input-brutal">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-3 border-t-4 border-black pt-4">
                <button type="submit" disabled={saving} className="btn-brutal flex-1">
                  {saving ? 'Guardando...' : 'Agregar Email'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-brutal-white flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

