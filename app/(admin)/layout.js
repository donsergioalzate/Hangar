'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutGrid, Package, FileText, Mail, LogOut, ChevronRight, Home } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutGrid size={18} /> },
  { href: '/dashboard/inventario', label: 'Inventario', icon: <Package size={18} /> },
  { href: '/dashboard/cotizaciones', label: 'Cotizaciones', icon: <FileText size={18} /> },
  { href: '/dashboard/emails', label: 'Emails Ocultos', icon: <Mail size={18} /> },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#FFE600] flex">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-black border-r-4 border-[#FFE600] flex flex-col min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="border-b-4 border-[#FFE600] p-6">
          <Link href="/" className="font-heading font-black text-2xl text-[#FFE600] uppercase tracking-tighter">
            HANGAR
          </Link>
          <p className="text-xs text-yellow-400 mt-1 font-bold uppercase">Panel Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-4 font-bold uppercase text-sm border-l-4 transition-all ${
                  isActive
                    ? 'border-[#FFE600] bg-[#FFE600] text-black'
                    : 'border-transparent text-gray-400 hover:border-[#FFE600] hover:text-[#FFE600] hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="border-t-4 border-[#FFE600] p-4 space-y-2">
          {session && (
            <div className="px-2 py-2">
              <p className="text-[#FFE600] font-bold text-sm truncate">{session.user.name}</p>
              <p className="text-gray-500 text-xs truncate">{session.user.email}</p>
            </div>
          )}
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-[#FFE600] text-sm font-bold uppercase transition-colors">
            <Home size={16} /> Ir al Sitio
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 text-sm font-bold uppercase transition-colors"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
