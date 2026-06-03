export interface ProviderCredential {
  id: string
  providerSource: string
  key: string
  label: string
  hasValue: boolean
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProviderCredentialPayload {
  providerSource: string
  key: string
  label: string
  value: string
  isActive?: boolean
  expiresAt?: string
}

export interface UpdateProviderCredentialPayload {
  label?: string
  value?: string
  isActive?: boolean
  expiresAt?: string | null
}
