import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">Página não encontrada.</p>
      <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
        Voltar para a home
      </Link>
    </div>
  )
}
