import { Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-brand-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
          className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-brand-100 hover:bg-brand-50 md:hidden"
        >
          <Menu size={20} />
        </button>

        <main className="flex-1 px-4 py-5 pt-16 sm:px-6 sm:py-6 md:pt-6">{children}</main>
      </div>
    </div>
  )
}
