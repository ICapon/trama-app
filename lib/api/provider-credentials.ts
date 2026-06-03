import { api } from "./client"
import type { ProviderCredential, CreateProviderCredentialPayload, UpdateProviderCredentialPayload } from "@/types/provider-credential"

export const providerCredentialsApi = {
  list(source?: string) {
    return api.get<ProviderCredential[]>("/api/provider-credentials", source ? { params: { source } } : undefined)
  },
  create(payload: CreateProviderCredentialPayload) {
    return api.post<ProviderCredential>("/api/provider-credentials", payload)
  },
  update(id: string, payload: UpdateProviderCredentialPayload) {
    return api.patch<ProviderCredential>(`/api/provider-credentials/${id}`, payload)
  },
  remove(id: string) {
    return api.delete(`/api/provider-credentials/${id}`)
  },
}
