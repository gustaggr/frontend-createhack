import { api } from './api'

export type Role = 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'LEADER' | 'MISSIONARY' | 'FAMILY'

export interface Institution {
  id: string
  name: string
  displayName: string
  country: string
  defaultLanguage: string
  timezone: string
  email: string
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  createdAt: string
}

export interface WebhookConfig {
  url: string
  active: boolean
  updatedAt: string
}

export interface Member {
  userId: string
  fullName: string
  preferredName: string | null
  email: string
  role: 'INSTITUTION_ADMIN' | 'LEADER' | 'MISSIONARY'
  group?: { id: string; name: string } | null
}

export interface Group {
  id: string
  name: string
  description: string | null
  locality: string | null
  status: 'ACTIVE' | 'INACTIVE'
  leader: { id: string; fullName: string }
  memberCount: number
}

export interface GroupDetail {
  id: string
  name: string
  description: string | null
  locality: string | null
  status: 'ACTIVE' | 'INACTIVE'
  leader: { id: string; fullName: string; email: string }
  members: { id: string; fullName: string; email: string }[]
  canReassignLeader: boolean
}

export interface InviteSummary {
  id: string
  email: string
  fullName: string
  role: Role
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  expiresAt: string
  createdAt: string
  lastWebhookError: string | null
  group: { name: string } | null
}

export const adminApi = {
  listInstitutions: () => api.get<Institution[]>('/institutions'),
  createInstitution: (dto: {
    name: string
    displayName: string
    country: string
    defaultLanguage: string
    timezone: string
    email: string
  }) => api.post<Institution>('/institutions', dto),
  getInstitution: (institutionId: string) => api.get<Institution>(`/institutions/${institutionId}`),

  getWebhookConfig: () => api.get<WebhookConfig | null>('/webhook-config'),
  configureWebhook: (url: string) =>
    api.put<{ url: string; active: boolean; secret: string }>('/webhook-config', { url }),

  listMembers: (institutionId: string, role?: 'INSTITUTION_ADMIN' | 'LEADER' | 'MISSIONARY') =>
    api.get<Member[]>(`/institutions/${institutionId}/members${role ? `?role=${role}` : ''}`),

  listGroups: (institutionId: string) => api.get<Group[]>(`/institutions/${institutionId}/groups`),
  createGroup: (
    institutionId: string,
    dto: { name: string; description?: string; locality?: string; leaderId: string },
  ) => api.post<Group>(`/institutions/${institutionId}/groups`, dto),
  getGroup: (institutionId: string, groupId: string) =>
    api.get<GroupDetail>(`/institutions/${institutionId}/groups/${groupId}`),
  updateGroup: (
    institutionId: string,
    groupId: string,
    dto: { name?: string; description?: string; locality?: string; leaderId?: string },
  ) => api.patch<Group>(`/institutions/${institutionId}/groups/${groupId}`, dto),

  listInvites: (institutionId: string) => api.get<InviteSummary[]>(`/institutions/${institutionId}/invites`),
  createInvite: (
    institutionId: string,
    dto: { email: string; fullName: string; role: Role; groupId?: string },
  ) =>
    api.post<{ id: string; activationLink: string; expiresAt: string }>(
      `/institutions/${institutionId}/invites`,
      dto,
    ),
  resendInvite: (inviteId: string) =>
    api.post<{ activationLink: string; expiresAt: string }>(`/invites/${inviteId}/resend`),
}
