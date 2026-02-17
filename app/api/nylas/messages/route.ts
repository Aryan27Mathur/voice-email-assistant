import { NextRequest, NextResponse } from "next/server"
import { getNylasClient } from "@/lib/nylas"
import { getGrant } from "@/lib/grant-store"
import type { Email } from "@/lib/types"
import { stripHtmlFromBody } from "@/lib/attachment-parser"

function formatMessage(msg: {
  id: string
  from?: { email?: string; name?: string }[]
  subject?: string
  snippet?: string
  body?: string
  date?: number
  unread?: boolean
  starred?: boolean
  folders?: string[]
  threadId?: string
  attachments?: { id: string; filename: string; contentType: string; size?: number }[]
}): Email {
  const from = msg.from?.[0]
  return {
    id: msg.id,
    from: from?.name || from?.email || "Unknown",
    fromEmail: from?.email || "",
    subject: msg.subject || "(No subject)",
    snippet: msg.snippet || stripHtmlFromBody(msg.body).slice(0, 100) + "...",
    body: stripHtmlFromBody(msg.body),
    htmlBody: msg.body || "",
    date: msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString(),
    read: !msg.unread,
    starred: msg.starred ?? false,
    labels: msg.folders || [],
    threadId: msg.threadId,
    attachments: (msg.attachments || []).map((a) => ({
      id: a.id,
      filename: a.filename,
      contentType: a.contentType,
      size: a.size ?? 0,
    })),
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryGrantId = searchParams.get("grant_id")
    const grant = getGrant()
    const envGrantId = process.env.NYLAS_GRANT_ID
    const grantId = queryGrantId || grant?.grantId || envGrantId

    if (!grantId) {
      return NextResponse.json(
        { error: "No email connected. Connect via /api/nylas/auth or set NYLAS_GRANT_ID." },
        { status: 400 }
      )
    }

    const nylas = getNylasClient()
    const unread = searchParams.get("unread")
    const hasAttachment = searchParams.get("hasAttachment")
    const searchQuery = searchParams.get("search")
    const threadId = searchParams.get("thread_id") || searchParams.get("threadId")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200)

    const queryParams: Record<string, unknown> = { limit }
    if (unread === "true") queryParams.unread = true
    if (hasAttachment === "true") queryParams.hasAttachment = true
    if (searchQuery) queryParams.searchQueryNative = searchQuery
    if (threadId) queryParams.threadId = threadId

    const response = await nylas.messages.list({
      identifier: grantId,
      queryParams: queryParams as Parameters<typeof nylas.messages.list>[0]["queryParams"],
    })

    const firstPage = await response
    const items = firstPage.data || []
    const messages: Email[] = items.map((msg) =>
      formatMessage(msg as Parameters<typeof formatMessage>[0])
    )

    return NextResponse.json(messages)
  } catch (err) {
    console.error("Nylas messages error:", err)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}
