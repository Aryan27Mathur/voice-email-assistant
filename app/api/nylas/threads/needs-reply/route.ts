import { NextRequest, NextResponse } from "next/server"
import { getNylasClient } from "@/lib/nylas"
import { getGrant } from "@/lib/grant-store"
import type { EmailThread, EmailThreadParticipant } from "@/lib/types"

function formatThread(thread: {
  id: string
  subject?: string
  snippet?: string
  messageIds: string[]
  unread?: boolean
  starred?: boolean
  latestMessageReceivedDate?: number
  latestMessageSentDate?: number
  participants?: { name?: string; email?: string }[]
  hasAttachments?: boolean
}): EmailThread {
  const received = thread.latestMessageReceivedDate ?? 0
  const sent = thread.latestMessageSentDate ?? 0
  const hasMultipleMessages = (thread.messageIds?.length ?? 0) >= 2
  const needsReply = hasMultipleMessages && received > sent

  const participants: EmailThreadParticipant[] = (thread.participants || []).map(
    (p: { name?: string; email?: string }) => ({
      name: p.name || p.email || "Unknown",
      email: p.email || "",
    })
  )

  return {
    id: thread.id,
    subject: thread.subject || "(No subject)",
    snippet: (thread.snippet || "").slice(0, 150),
    messageIds: thread.messageIds || [],
    unread: thread.unread ?? false,
    starred: thread.starred ?? false,
    latestMessageReceivedDate: thread.latestMessageReceivedDate,
    latestMessageSentDate: thread.latestMessageSentDate,
    participants,
    hasAttachments: thread.hasAttachments ?? false,
    needsReply,
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200)

    const response = await nylas.threads.list({
      identifier: grantId,
      queryParams: { limit } as Parameters<typeof nylas.threads.list>[0]["queryParams"],
    })

    const firstPage = await response
    const items = firstPage.data || []
    const threads: EmailThread[] = items
      .map((t) => formatThread(t as Parameters<typeof formatThread>[0]))
      .filter((t) => t.needsReply)

    return NextResponse.json(threads)
  } catch (err) {
    console.error("Nylas threads needs-reply error:", err)
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    )
  }
}
