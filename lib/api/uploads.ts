export interface UploadResponse {
  id: string
  url: string
  filename: string
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? ""
  const url = base ? `${base}/uploads` : "/api/uploads"

  const form = new FormData()
  form.append("file", file)

  const res = await fetch(url, { method: "POST", body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? "Upload failed")
  }
  return res.json() as Promise<UploadResponse>
}
