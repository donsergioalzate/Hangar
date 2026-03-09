'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from './CartContext';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#FFE600] border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="font-black text-2xl tracking-tighter text-black uppercase hover:opacity-80 transition-opacity">
          HANGAR
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="font-bold text-black hover:underline decoration-4 underline-offset-4 uppercase text-sm">Inicio</Link>
          <Link href="/catalogo" className="font-bold text-black hover:underline decoration-4 underline-offset-4 uppercase text-sm">Catálogo</Link>
          <Link href="/#sobre-nosotros" className="font-bold text-black hover:underline decoration-4 underline-offset-4 uppercase text-sm">Nosotros</Link>
          <Link href="/#contacto" className="font-bold text-black hover:underline decoration-4 underline-offset-4 uppercase text-sm">Contacto</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link href="/carrito" className="relative flex items-center gap-1 bg-black text-[#FFE600] border-2 border-black px-3 py-1.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Carrito</span>
            {itemCount > 0 && (
              <span className="bg-[#FFE600] text-black text-xs font-black px-1.5 rounded-full border-2 border-black">{itemCount}</span>
            )}
          </Link>

          {/* Account */}
          {session ? (
            <div className="flex items-center gap-2">
              {session.user.role === 'ADMIN' && (
                <Link href="/dashboard" className="hidden sm:flex items-center bg-black text-[#FFE600] border-2 border-black px-3 py-1.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  Admin
                </Link>
              )}
              <Link href="/mi-cuenta" className="flex items-center gap-1 bg-white text-black border-2 border-black px-3 py-1.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                <User size={16} />
                <span className="hidden sm:inline">{session.user.name?.split(' ')[0]}</span>
              </Link>
            </div>
          ) : (
            <Link href="/mi-cuenta" className="flex items-center gap-1 bg-white text-black border-2 border-black px-3 py-1.5 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <User size={16} />
              <span className="hidden sm:inline">Mi Cuenta</span>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t-4 border-black bg-[#FFE600] px-4 py-4 flex flex-col gap-4">
          <Link href="/" onClick={() => setMenuOpen(false)} className="font-bold text-black uppercase text-sm">Inicio</Link>
          <Link href="/catalogo" onClick={() => setMenuOpen(false)} className="font-bold text-black uppercase text-sm">Catálogo</Link>
          <Link href="/#sobre-nosotros" onClick={() => setMenuOpen(false)} className="font-bold text-black uppercase text-sm">Nosotros</Link>
          <Link href="/#contacto" onClick={() => setMenuOpen(false)} className="font-bold text-black uppercase text-sm">Contacto</Link>
          {session?.user?.role === 'ADMIN' && (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="font-bold text-black uppercase text-sm">Dashboard Admin</Link>
          )}
          {session && (
            <button onClick={() => { signOut(); setMenuOpen(false); }} className="text-left font-bold text-black uppercase text-sm">Cerrar Sesión</button>
          )}
        </div>
      )}
    </nav>
  );
}
