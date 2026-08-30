import { api } from './api'

export type MaterialType = 'VIDEO' | 'PDF'
export type MaterialScope = 'INDIVIDUAL' | 'GROUP' | 'LEADER_ALL' | 'INSTITUTION'

export interface UploadAuth {
  token: string
  expire: number
  signature: string
  publicKey: string
  urlEndpoint: string
}

export interface Material {
  id: string
  type: MaterialType
  title: string
  description: string | null
  fileUrl: string
  fileId: string
  thumbnailUrl: string | null
  scope: MaterialScope
  missionaryId: string | null
  groupId: string | null
  leaderId: string | null
  createdAt: string
  missionary: { id: string; fullName: string } | null
  group: { id: string; name: string } | null
  _count: { views: number }
  audienceSize: number
}

export interface CreateMaterialDto {
  type: MaterialType
  title: string
  description?: string
  scope: MaterialScope
  missionaryId?: string
  groupId?: string
  fileUrl: string
  fileId: string
  thumbnailUrl?: string
}

export interface MaterialViewer {
  missionaryId: string
  fullName: string
  viewed: boolean
  viewedAt: string | null
}

export interface MyMaterial {
  id: string
  type: MaterialType
  title: string
  description: string | null
  fileUrl: string
  thumbnailUrl: string | null
  scope: MaterialScope
  createdAt: string
  viewed: boolean
  viewedAt: string | null
}

export const materialsApi = {
  getUploadAuth: (institutionId: string) =>
    api.post<UploadAuth>(`/institutions/${institutionId}/materials/upload-auth`),
  createMaterial: (institutionId: string, dto: CreateMaterialDto) =>
    api.post<Material>(`/institutions/${institutionId}/materials`, dto),
  listMaterials: (institutionId: string) =>
    api.get<Material[]>(`/institutions/${institutionId}/materials`),
  deleteMaterial: (institutionId: string, materialId: string) =>
    api.delete(`/institutions/${institutionId}/materials/${materialId}`),
  getViewers: (institutionId: string, materialId: string) =>
    api.get<MaterialViewer[]>(`/institutions/${institutionId}/materials/${materialId}/viewers`),

  listMyMaterials: () => api.get<MyMaterial[]>('/materials/mine'),
  markViewed: (materialId: string) => api.post(`/materials/${materialId}/view`),
}
