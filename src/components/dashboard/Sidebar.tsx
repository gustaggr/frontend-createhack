import {
  Building2,
  ChevronsLeft,
  ChevronsRight,
  FileVideo,
  Home,
  LogOut,
  User,
  Users2,
  UsersRound,
  Webhook,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  icon: LucideIcon
  label: string
  to: string
}

const BASE_NAV_ITEMS: NavItem[] = [{ icon: Home, label: 'Início', to: '/home' }]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function useNavItems(): NavItem[] {
  const { user } = useAuth()
  const items = [...BASE_NAV_ITEMS]

  const superAdminRole = user?.roles.find((r) => r.role === 'SUPER_ADMIN' && r.status === 'ACTIVE')
  if (superAdminRole) {
    items.splice(
      1,
      0,
      { icon: Building2, label: 'Instituições', to: '/admin/institutions' },
      { icon: Webhook, label: 'Webhook', to: '/admin/webhook' },
    )
  }

  const institutionAdminRole = user?.roles.find(
    (r) => r.role === 'INSTITUTION_ADMIN' && r.status === 'ACTIVE' && r.institutionId,
  )
  if (institutionAdminRole) {
    items.splice(1, 0, {
      icon: Users2,
      label: 'Equipe',
      to: `/admin/institutions/${institutionAdminRole.institutionId}`,
    })
  }

  const leaderRole = user?.roles.find(
    (r) => r.role === 'LEADER' && r.status === 'ACTIVE' && r.institutionId,
  )
  if (leaderRole) {
    items.splice(
      1,
      0,
      { icon: UsersRound, label: 'Meus grupos', to: '/my-groups' },
      { icon: FileVideo, label: 'Materiais', to: `/admin/institutions/${leaderRole.institutionId}/materials` },
    )
  }

  const missionaryRole = user?.roles.find((r) => r.role === 'MISSIONARY' && r.status === 'ACTIVE')
  if (missionaryRole) {
    items.splice(1, 0, { icon: FileVideo, label: 'Materiais', to: '/materials' })
  }

  return items
}

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-1 ${collapsed ? 'justify-center' : ''}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">
        W
      </div>
      {!collapsed && <span className="text-lg font-bold text-slate-900">With</span>}
    </div>
  )
}

function navLinkClass(collapsed: boolean) {
  return ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      collapsed ? 'justify-center' : ''
    } ${
      isActive
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-200/60'
        : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600'
    }`
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Administrador',
  INSTITUTION_ADMIN: 'Diretor(a)',
  LEADER: 'Líder',
  MISSIONARY: 'Missionário(a)',
  FAMILY: 'Familiar',
}

function UserCard({ collapsed }: { collapsed: boolean }) {
  const { user, activeRole } = useAuth()
  if (!user) return null

  const initial = (user.preferredName ?? user.fullName).charAt(0).toUpperCase()

  if (collapsed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center self-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
        {initial}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
        {initial}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">
          {user.preferredName ?? user.fullName}
        </p>
        <p className="truncate text-xs text-slate-500">
          {activeRole ? ROLE_LABELS[activeRole.role] : ''}
        </p>
      </div>
    </div>
  )
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const items = useNavItems()

  return (
    <nav className="flex w-full flex-col gap-1">
      {items.map(({ icon: Icon, label, to }) => (
        <NavLink
          key={label}
          to={to}
          title={collapsed ? label : undefined}
          className={navLinkClass(collapsed)}
          onClick={onNavigate}
        >
          <Icon size={20} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarFooter({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex w-full flex-col gap-2 border-t border-brand-50 pt-3">
      <UserCard collapsed={collapsed} />

      <NavLink
        to="/profile"
        title={collapsed ? 'Meu perfil' : undefined}
        className={navLinkClass(collapsed)}
        onClick={onNavigate}
      >
        <User size={20} className="shrink-0" />
        {!collapsed && <span className="truncate">Meu perfil</span>}
      </NavLink>

      <button
        onClick={handleLogout}
        title={collapsed ? 'Sair' : undefined}
        aria-label="Sair"
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <LogOut size={20} className="shrink-0" />
        {!collapsed && <span className="truncate">Sair</span>}
      </button>
    </div>
  )
}

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  } catch {
    return false
  }
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(getStoredCollapsed)

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem('sidebarCollapsed', String(next))
      } catch {
        // localStorage indisponível (modo privado, etc.) — ignora persistência
      }
      return next
    })
  }

  return (
    <>
      {/* Desktop: trilho fixo, recolhível */}
      <aside
        className={`hidden shrink-0 flex-col gap-6 overflow-y-auto border-r border-brand-100 bg-white py-6 transition-all duration-200 md:flex ${
          collapsed ? 'w-20 px-3' : 'w-60 px-3'
        }`}
      >
        <Logo collapsed={collapsed} />
        <NavList collapsed={collapsed} />

        <div className="mt-auto flex flex-col gap-1">
          <SidebarFooter collapsed={collapsed} />

          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Mobile: gaveta sobreposta */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col gap-6 overflow-y-auto bg-white px-3 py-6 shadow-xl">
            <div className="flex items-center justify-between px-1">
              <Logo collapsed={false} />
              <button
                aria-label="Fechar menu"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-brand-50"
              >
                <X size={18} />
              </button>
            </div>
            <NavList collapsed={false} onNavigate={onClose} />
            <div className="mt-auto">
              <SidebarFooter collapsed={false} onNavigate={onClose} />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
