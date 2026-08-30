import { FileText, FileVideo } from 'lucide-react'
import { useEffect, useState } from 'react'

import VideoPlayer from '../components/materials/VideoPlayer'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { materialsApi, type MyMaterial } from '../lib/materialsApi'

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MyMaterial[] | null>(null)
  const [open, setOpen] = useState<MyMaterial | null>(null)

  function load() {
    materialsApi
      .listMyMaterials()
      .then(setMaterials)
      .catch(() => setMaterials([]))
  }

  useEffect(load, [])

  async function handleOpen(m: MyMaterial) {
    setOpen(m)
    if (!m.viewed) {
      try {
        await materialsApi.markViewed(m.id)
        setMaterials((prev) => prev?.map((x) => (x.id === m.id ? { ...x, viewed: true } : x)) ?? prev)
      } catch {
        // sem toast nesta rodada — não bloqueia a visualização do material
      }
    }
  }

  if (materials === null) return null

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-white tracking-tight">Materiais</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 lg:text-white/80">
          Vídeos e PDFs que seu líder compartilhou com você.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {materials.map((m) => (
          <Card
            key={m.id}
            onClick={() => handleOpen(m)}
            className="cursor-pointer shadow-sm border border-slate-100 transition-colors hover:border-brand-300"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-brand-600">
                {m.type === 'VIDEO' ? <FileVideo size={18} /> : <FileText size={18} />}
                <h3 className="font-semibold text-slate-900">{m.title}</h3>
              </div>
              {!m.viewed && (
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  Novo
                </span>
              )}
            </div>
            {m.description && <p className="mt-2 text-sm text-slate-600">{m.description}</p>}
          </Card>
        ))}
        {materials.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-slate-400">
            Nenhum material disponível ainda.
          </p>
        )}
      </div>

      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)} maxWidth="max-w-2xl">
          {open.description && <p className="mb-4 text-sm text-slate-600">{open.description}</p>}
          {open.type === 'VIDEO' ? (
            <VideoPlayer src={open.fileUrl} poster={open.thumbnailUrl} />
          ) : (
            <div className="space-y-3">
              <iframe title={open.title} src={open.fileUrl} className="h-[70vh] w-full rounded-2xl border border-slate-100" />
              <a
                href={open.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Abrir em nova aba / baixar
              </a>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
