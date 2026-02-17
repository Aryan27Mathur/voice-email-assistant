import { NextRequest, NextResponse } from "next/server"
import { getGrant } from "@/lib/grant-store"

type SelectedEmailContext = {
  emailId: string
  subject?: string
  from?: string
  snippet?: string
}

// In-memory store: grant_id -> context (single-user local; use Redis/DB in prod)
const contextStore = new Map<string, SelectedEmailContext | null>()

function getGrantId(req: NextRequest): string | null {
  const queryGrantId = req.nextUrl.searchParams.get("grant_id")
  const grant = getGrant()
  const envGrantId = process.env.NYLAS_GRANT_ID
  return queryGrantId || grant?.grantId || envGrantId || null
}

export async function GET(request: NextRequest) {
  try {
    const grantId = getGrantId(request)
    if (!grantId) {
      return NextResponse.json(
        { error: "No grant_id. Pass grant_id query param or ensure Nylas is connected." },
        { status: 400 }
      )
    }

    const context = contextStore.get(grantId) ?? null
    return NextResponse.json(context)
  } catch (err) {
    console.error("Context GET error:", err)
    return NextResponse.json({ error: "Failed to get context" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const grantId = body.grant_id || getGrantId(request)
    if (!grantId) {
      return NextResponse.json(
        { error: "No grant_id. Pass grant_id in body or ensure Nylas is connected." },
        { status: 400 }
      )
    }

    if (body.emailId == null || body.emailId === "") {
      contextStore.set(grantId, null)
      return NextResponse.json({ ok: true, cleared: true })
    }

    const context: SelectedEmailContext = {
      emailId: String(body.emailId),
      subject: body.subject,
      from: body.from,
      snippet: body.snippet,
    }
    contextStore.set(grantId, context)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Context POST error:", err)
    return NextResponse.json({ error: "Failed to set context" }, { status: 500 })
  }
}
