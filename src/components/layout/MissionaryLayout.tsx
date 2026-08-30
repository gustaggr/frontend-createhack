import { Link, Outlet, useLocation } from 'react-router-dom';
import { FileVideo, Home, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function MissionaryLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Início', path: '/home', icon: Home },
    { name: 'Materiais', path: '/materials', icon: FileVideo },
    { name: 'Perfil', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Desktop Header */}
      <header className="hidden md:flex bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="With Logo" className="h-8 w-auto" />
          </div>
          <nav className="flex items-center gap-6">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 md:py-10 pb-28 md:pb-10 relative">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 pb-2">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center w-full h-full gap-1 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-brand-50/80 rounded-2xl m-1"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={24}
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-brand-600' : 'text-slate-500'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
