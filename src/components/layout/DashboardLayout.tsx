import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  X,
  Menu,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Users,
  Webhook,
  FileVideo,
  Home,
  User
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MissionaryLayout } from "./MissionaryLayout";

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const navRef = useRef<HTMLElement>(null);
  const activeButtonRef = useRef<HTMLAnchorElement>(null);

  const { user, activeRole, logout } = useAuth();

  if (activeRole?.role === 'MISSIONARY') {
    return <MissionaryLayout />;
  }

  useEffect(() => {
    if (activeButtonRef.current && navRef.current) {
      activeButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
    } catch { }
  }, [isCollapsed]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  interface SidebarLink {
    name: string;
    path?: string;
    icon: React.ComponentType<any>;
    subItems?: Array<{ name: string; path: string }>;
  }

  const navLinks: SidebarLink[] = [
    { name: "Início", path: '/home', icon: Home },
  ];

  const superAdminRole = user?.roles.find((r) => r.role === 'SUPER_ADMIN' && r.status === 'ACTIVE');
  if (superAdminRole) {
    navLinks.push(
      { name: "Instituições", path: '/admin/institutions', icon: LayoutDashboard },
      { name: "Webhooks", path: '/admin/webhook', icon: Webhook }
    );
  }

  const institutionAdminRole = user?.roles.find(
    (r) => r.role === 'INSTITUTION_ADMIN' && r.status === 'ACTIVE' && r.institutionId
  );
  if (institutionAdminRole) {
    navLinks.push({
      name: "Equipe",
      path: `/admin/institutions/${institutionAdminRole.institutionId}`,
      icon: Users
    });
  }

  const leaderRole = user?.roles.find(
    (r) => r.role === 'LEADER' && r.status === 'ACTIVE' && r.institutionId
  );
  if (leaderRole) {
    navLinks.push(
      { name: "Meus Grupos", path: '/my-groups', icon: Users },
      { name: "Materiais", path: `/admin/institutions/${leaderRole.institutionId}/materials`, icon: FileVideo },
    );
  }

  useEffect(() => {
    const activeLink = navLinks.find(link =>
      link.subItems?.some(sub => location.pathname === sub.path)
    );
    if (activeLink) {
      setOpenDropdown(activeLink.name);
    }
  }, [location.pathname]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8">
      <div className={`mb-12 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4`}>
        <div className="flex items-center justify-center">
          <img 
            src={isCollapsed ? "/logo-w.svg" : "/logo.svg"}
            alt="Logo With" 
            className={`transition-all duration-300 ${isCollapsed ? 'h-6 w-auto' : 'h-10 w-auto'}`} 
          />
        </div>

        <button
          onClick={() => setIsCollapsed((s) => !s)}
          className="hidden lg:inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:bg-slate-50"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav ref={navRef} className={`flex-1 ${isCollapsed ? 'px-1' : 'px-4'} space-y-1 overflow-y-auto custom-scrollbar pb-4`}>
        {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Menu Principal</p>}

        {navLinks.map((link) => {
          const Icon = link.icon;
          const hasSubItems = !!link.subItems;
          const isActive = !hasSubItems && location.pathname === link.path;
          const isDropdownOpen = openDropdown === link.name;
          const isAnyChildActive = hasSubItems && link.subItems?.some(sub => location.pathname === sub.path);

          return (
            <div key={link.name}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleDropdown(link.name)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'px-2' : 'px-4'} py-3 rounded-2xl text-sm font-bold transition-all group ${isAnyChildActive
                    ? 'bg-[#F97316]/5 text-[#F97316]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#F97316]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isAnyChildActive ? 'text-[#F97316]' : 'text-slate-400 group-hover:text-[#F97316]'} />
                    {!isCollapsed && link.name}
                  </div>
                  {!isCollapsed && (isDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                </button>
              ) : (
                <Link
                  ref={isActive ? activeButtonRef : null}
                  to={link.path || '#'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'px-2' : 'px-4'} py-3 rounded-2xl text-sm font-bold transition-all group ${isActive
                    ? 'bg-[#F97316] text-white shadow-lg shadow-[#F97316]/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#F97316]'
                    }`}
                >
                  <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#F97316]'} />
                    {!isCollapsed && link.name}
                  </div>
                </Link>
              )}

              <AnimatePresence initial={false}>
                {hasSubItems && isDropdownOpen && !isCollapsed && (
                  <motion.div
                    key={`dropdown-${link.name}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      transition: { height: { duration: 0.25 }, opacity: { duration: 0.2 } }
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: { height: { duration: 0.2 }, opacity: { duration: 0.15 } }
                    }}
                    style={{ overflow: "hidden" }}
                    className="ml-4 pl-4 border-l border-slate-100 mt-1 space-y-1"
                  >
                    {link.subItems?.map((sub) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.name}
                          to={sub.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${isSubActive
                            ? 'bg-[#F97316] text-white'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#F97316]'
                            }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className={`px-4 mt-auto pt-6 border-t border-slate-100 ${isCollapsed ? 'space-y-2 px-2' : 'space-y-2'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-[#F97316]/10 flex items-center justify-center text-[#F97316] shrink-0 border border-[#F97316]/20 overflow-hidden">
                <UserIcon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-700 truncate leading-tight">{user?.preferredName || user?.fullName || "Usuário"}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate">{activeRole?.role || "USER"}</p>
              </div>
            </div>

            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-[#F97316] rounded-xl transition-all text-xs font-bold"
            >
              <User size={16} />
              Meu Perfil
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold"
            >
              <LogOut size={16} />
              Sair
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center p-3">
              <div className="w-10 h-10 rounded-full bg-[#F97316]/10 flex items-center justify-center text-[#F97316] shrink-0 border border-[#F97316]/20 overflow-hidden">
                <UserIcon size={18} />
              </div>
            </div>
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center p-2 text-slate-500 hover:bg-slate-50 hover:text-[#F97316] rounded-xl transition-all"
              aria-label="Meu Perfil"
            >
              <User size={16} />
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
              aria-label="Sair"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden w-full">

      <aside className={`hidden lg:block ${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-100 h-screen sticky top-0 shrink-0 shadow-sm z-20 transition-all duration-200`}>
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-70 bg-white z-110 lg:hidden shadow-2xl"
            >
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-5 right-4 p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed top-6 left-6 z-[90] p-3 bg-white shadow-xl rounded-2xl text-[#F97316] border border-slate-100"
        >
          <Menu size={24} />
        </button>

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar relative">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 bg-[#F97316] rounded-b-[40px] z-0 h-[220px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative z-10 p-6 lg:p-10 mt-16 lg:mt-0"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
