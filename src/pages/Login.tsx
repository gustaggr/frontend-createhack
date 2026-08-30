import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { Mail, Lock, LogIn } from 'lucide-react'

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/home'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/home', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('E-mail ou senha inválidos.')
      } else {
        setError('Não foi possível entrar. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1] bg-[radial-gradient(circle_at_top,#4a1c0d_0%,#1c0f0a_42%,#0f0704_100%)] font-sans overflow-auto">
      <div className="w-full min-h-screen">
        <div className="relative overflow-hidden bg-slate-950/40 flex min-h-screen">

          {/* Left Side: Form */}
          <section className="relative w-full lg:w-[52%] bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-center items-center">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bem-vindo ao With</h1>
                <p className="mt-2 text-base text-slate-500">Faça login para acessar o painel de cuidado missionário.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                      <Mail size={20} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 pl-12 pr-4 py-3.5 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all bg-slate-50 focus:bg-white"
                      placeholder="voce@exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                      <Lock size={20} />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 pl-12 pr-4 py-3.5 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all bg-slate-50 focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                    <p role="alert" className="text-sm font-medium text-red-600 text-center">
                      {error}
                    </p>
                  </div>
                )}

                <Button type="submit" isLoading={submitting} className="w-full h-12 text-base font-bold shadow-lg shadow-brand-500/25 transition-transform active:scale-[0.98]" size="lg">
                  {!submitting && <LogIn size={20} className="mr-2" />}
                  {submitting ? 'Entrando…' : 'Entrar na plataforma'}
                </Button>
              </form>
            </div>
          </section>

          {/* Right Side: Visual */}
          <section className="hidden lg:flex lg:w-[48%] relative overflow-hidden">
            {/* Orange-themed gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(249,115,22,0.32),transparent_45%),radial-gradient(circle_at_72%_28%,rgba(234,88,12,0.45),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255,237,213,0.1),transparent_45%),linear-gradient(135deg,#1f1209_10%,#3b1c0b_45%,#1c0c04_100%)]" />
            <div className="absolute inset-0 opacity-60 [background:conic-gradient(from_20deg_at_50%_50%,transparent_0deg,rgba(255,255,255,0.08)_90deg,transparent_170deg,rgba(255,255,255,0.05)_245deg,transparent_360deg)]" />

            <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
              <div>
                <img src="/logo.svg" alt="With" className="h-10 w-auto mb-8 opacity-80" />
                <h2 className="mt-4 text-5xl font-black leading-[1.1] tracking-tight">
                  Você carrega a missão.<br />Nós cuidamos de você.
                </h2>
                <p className="mt-6 text-lg text-white/70 font-medium max-w-md leading-relaxed">
                  A plataforma definitiva para líderes, instituições e missionários se conectarem com propósito.
                </p>
              </div>

              <div className="px-5 py-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl w-fit">
                <p className="text-sm text-white/80 font-semibold tracking-wide">WITH &copy; {new Date().getFullYear()}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
