import type { UploadAuth } from './materialsApi'

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

export interface ImageKitUploadResult {
  fileId: string
  url: string
  thumbnailUrl?: string
  name: string
}

/** Sobe o arquivo direto do navegador pro ImageKit (nunca passa pelo nosso
 * servidor) usando as credenciais assinadas pelo backend. XHR em vez de
 * fetch pra ter evento de progresso — útil pra vídeo. */
export function uploadToImageKit(
  file: File,
  auth: UploadAuth,
  onProgress?: (fraction: number) => void,
): Promise<ImageKitUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('publicKey', auth.publicKey)
    formData.append('signature', auth.signature)
    formData.append('expire', String(auth.expire))
    formData.append('token', auth.token)
    formData.append('useUniqueFileName', 'true')
    formData.append('folder', 'materials')

    const xhr = new XMLHttpRequest()
    xhr.open('POST', IMAGEKIT_UPLOAD_URL)

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new Error('Resposta inesperada do ImageKit'))
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText)
          reject(new Error(body?.message ?? `ImageKit respondeu com status ${xhr.status}`))
        } catch {
          reject(new Error(`ImageKit respondeu com status ${xhr.status}`))
        }
      }
    }
    xhr.onerror = () => reject(new Error('Falha de rede ao subir o arquivo'))

    xhr.send(formData)
  })
}
