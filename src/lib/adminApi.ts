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

export type WebhookEventType = 'INVITE_CREATED' | 'SCORE_ALERT'

export interface WebhookConfig {
  event: WebhookEventType
  url: string | null
  active: boolean
  updatedAt: string | null
}

export interface Member {
  userId: string
  fullName: string
  preferredName: string | null
  email: string
  phone: string | null
  role: 'INSTITUTION_ADMIN' | 'LEADER' | 'MISSIONARY'
  group?: { id: string; name: string } | null
}

export interface Group {
  id: string
  name: string
  description: string | null
  locality: string | null
  status: 'ACTIVE' | 'INACTIVE'
  leaders: { id: string; fullName: string }[]
  memberCount: number
}

export interface GroupDetail {
  id: string
  name: string
  description: string | null
  locality: string | null
  status: 'ACTIVE' | 'INACTIVE'
  leaders: { id: string; fullName: string; email: string }[]
  members: { id: string; fullName: string; email: string }[]
  canManageLeaders: boolean
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

  listWebhookConfigs: () => api.get<WebhookConfig[]>('/webhook-config'),
  configureWebhook: (event: WebhookEventType, url: string) =>
    api.put<{ event: WebhookEventType; url: string; active: boolean; secret: string }>('/webhook-config', {
      event,
      url,
    }),

  listMembers: (institutionId: string, role?: 'INSTITUTION_ADMIN' | 'LEADER' | 'MISSIONARY') =>
    api.get<Member[]>(`/institutions/${institutionId}/members${role ? `?role=${role}` : ''}`),

  listGroups: (institutionId: string) => api.get<Group[]>(`/institutions/${institutionId}/groups`),
  createGroup: (
    institutionId: string,
    dto: { name: string; description?: string; locality?: string; leaderIds?: string[] },
  ) => api.post<Group>(`/institutions/${institutionId}/groups`, dto),
  getGroup: (institutionId: string, groupId: string) =>
    api.get<GroupDetail>(`/institutions/${institutionId}/groups/${groupId}`),
  updateGroup: (
    institutionId: string,
    groupId: string,
    dto: { name?: string; description?: string; locality?: string; leaderIds?: string[] },
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

  updateMember: (
    institutionId: string,
    userId: string,
    data: { fullName?: string; email?: string; phone?: string; password?: string },
  ) => api.patch(`/institutions/${institutionId}/members/${userId}`, data),

  removeMember: (institutionId: string, userId: string) =>
    api.delete(`/institutions/${institutionId}/members/${userId}`),
}
