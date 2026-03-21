'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { User, LogOut, Package, Calendar, CheckCircle, Clock, RotateCcw, AlertTriangle } from 'lucide-react';

const STATUS_MAP = {
  NEW: { label: 'Nueva', color: 'bg-blue-500 text-white', icon: <Clock size={14} /> },
  CONFIRMED: { label: 'Confirmada', color: 'bg-green-500 text-white', icon: <CheckCircle size={14} /> },
  RETURNED: { label: 'Devuelta', color: 'bg-gray-500 text-white', icon: <RotateCcw size={14} /> }
};

export default function MiCuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [tab, setTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', phone: '', productionCompany: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchQuotes();
      if (redirect) router.push(redirect);
    }
  }, [session, redirect]);

  const fetchQuotes = async () => {
    setQuotesLoading(true);
    try {
      const res = await fetch('/api/quotes');
      const data = await res.json();
      setQuotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setQuotes([]);
    } finally {
      setQuotesLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false
      });
      if (result?.error) {
        setError('Email o contraseña incorrectos. Verifica tus datos.');
      }
    } catch (e) {
      setError('Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al registrarse'); return; }
      // Auto login after register
      await signIn('credentials', { email: registerForm.email, password: registerForm.password, redirect: false });
    } catch (e) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#ffc832]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="font-heading text-2xl font-black animate-pulse">Cargando...</div>
        </div>
      </div>
    );
  }

  // If logged in, show profile
  if (session) {
    return (
      <div className="min-h-screen bg-[#ffc832]">
        <Navbar />

        <div className="border-b-4 border-black bg-white px-4 py-8">
          <div className="max-w-7xl mx-auto flex items-start justify-between">
            <div>
              <h1 className="font-heading text-4xl font-black uppercase text-black">Mi Cuenta</h1>
              <p className="text-gray-600">Bienvenido, {session.user.name}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 bg-black text-[#ffc832] border-4 border-black px-4 py-2 font-bold uppercase text-sm shadow-brutal hover:shadow-brutal-xs hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[300px,1fr] gap-8">

            {/* Profile Card */}
            <div className="space-y-4">
              <div className="card-brutal p-6">
                <div className="w-16 h-16 bg-black border-4 border-black flex items-center justify-center mb-4 shadow-brutal-sm">
                  <User size={28} className="text-[#ffc832]" />
                </div>
                <h2 className="font-heading font-black text-xl uppercase mb-1">{session.user.name}</h2>
                <p className="text-sm text-gray-600 mb-1">{session.user.email}</p>
                {session.user.phone && <p className="text-sm text-gray-600 mb-1">{session.user.phone}</p>}
                {session.user.productionCompany && <p className="text-sm text-gray-600">{session.user.productionCompany}</p>}
                <div className="mt-4 pt-4 border-t-2 border-black">
                  <span className={`text-xs font-black uppercase px-2 py-1 border-2 border-black ${session.user.role === 'ADMIN' ? 'bg-[#ffc832]' : 'bg-gray-100'}`}>
                    {session.user.role}
                  </span>
                </div>
              </div>
              {session.user.role === 'ADMIN' && (
                <Link href="/dashboard" className="btn-brutal w-full flex items-center justify-center gap-2">
                  Ir al Dashboard Admin
                </Link>
              )}
            </div>

            {/* Quotes */}
            <div>
              <h2 className="font-heading text-2xl font-black uppercase mb-6">Mis Cotizaciones</h2>
              {quotesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="card-brutal h-24 animate-pulse" />)}
                </div>
              ) : quotes.length === 0 ? (
                <div className="card-brutal p-12 text-center">
                  <Package size={40} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-bold text-gray-500">No tienes cotizaciones aún</p>
                  <Link href="/catalogo" className="btn-brutal inline-flex items-center gap-2 mt-4 text-sm">
                    Explorar Catálogo
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map(quote => {
                    const st = STATUS_MAP[quote.status] || STATUS_MAP.NEW;
                    return (
                      <div key={quote.id} className="card-brutal p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="font-heading font-black text-xl">{quote.folio}</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(quote.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 border-2 border-black text-xs font-black uppercase ${st.color}`}>
                            {st.icon} {st.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t-2 border-gray-200 pt-3">
                          <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(quote.startDate).toLocaleDateString('es-MX')} — {new Date(quote.endDate).toLocaleDateString('es-MX')}</span>
                          <span className="flex items-center gap-1"><Package size={14} /> {quote.items?.length} props</span>
                          <span className="font-black text-black">${quote.totalCost?.toLocaleString('es-MX')} MXN</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login/Register forms
  return (
    <div className="min-h-screen bg-[#ffc832]">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-16">
        {searchParams.get('unauthorized') && (
          <div className="bg-orange-100 border-4 border-orange-500 p-4 mb-6 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-600" />
            <p className="font-bold text-orange-800 text-sm">No tienes permisos para acceder a esa sección.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-4 border-black mb-0 shadow-brutal">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 font-black uppercase text-sm border-r-2 border-black transition-colors ${tab === 'login' ? 'bg-black text-[#ffc832]' : 'bg-[#ffc832] text-black hover:bg-white'}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-3 font-black uppercase text-sm transition-colors ${tab === 'register' ? 'bg-black text-[#ffc832]' : 'bg-[#ffc832] text-black hover:bg-white'}`}
          >
            Crear Cuenta
          </button>
        </div>

        <div className="card-brutal p-8 border-t-0">
          {error && (
            <div className="bg-red-100 border-4 border-red-500 p-4 mb-6 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <p className="text-red-700 font-bold text-sm">{error}</p>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase block mb-2">Email</label>
                <input
                  type="email" required value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  className="input-brutal" placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase block mb-2">Contraseña</label>
                <input
                  type="password" required value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  className="input-brutal" placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-brutal w-full text-center py-4 disabled:opacity-60">
                {loading ? 'Entrando...' : 'Iniciar Sesión'}
              </button>
              <p className="text-center text-xs text-gray-600">
                Demo admin: <span className="font-bold">admin@hangar.mx / Hangar2024!</span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase block mb-2">Nombre Completo *</label>
                  <input
                    type="text" required value={registerForm.name}
                    onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))}
                    className="input-brutal" placeholder="Tu nombre"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase block mb-2">Email *</label>
                  <input
                    type="email" required value={registerForm.email}
                    onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
                    className="input-brutal" placeholder="tu@email.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase block mb-2">Contraseña *</label>
                  <input
                    type="password" required value={registerForm.password}
                    onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                    className="input-brutal" placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-2">Teléfono</label>
                  <input
                    type="tel" value={registerForm.phone}
                    onChange={e => setRegisterForm(p => ({ ...p, phone: e.target.value }))}
                    className="input-brutal" placeholder="+52 55..."
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-2">Empresa</label>
                  <input
                    type="text" value={registerForm.productionCompany}
                    onChange={e => setRegisterForm(p => ({ ...p, productionCompany: e.target.value }))}
                    className="input-brutal" placeholder="Nombre empresa"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-brutal w-full text-center py-4 disabled:opacity-60">
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

