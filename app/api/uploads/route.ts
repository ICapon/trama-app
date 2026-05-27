import { NextResponse } from "next/server"

const BACKEND = process.env.API_URL

export async function POST(request: Request) {
  if (BACKEND) {
    const contentType = request.headers.get("content-type") ?? ""
    const body = await request.arrayBuffer()
    const res = await fetch(`${BACKEND}/uploads`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  // Mock: accept the file and return a fake response
  const form = await request.formData()
  const file = form.get("file")
  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "No file provided" }, { status: 400 })
  }
  const id = crypto.randomUUID()
  return NextResponse.json(
    { id, url: `http://localhost:3001/api/uploads/${id}`, filename: (file as File).name },
    { status: 201 },
  )
}
