import { NextRequest, NextResponse } from "next/server"
import { getNylasClient } from "@/lib/nylas"
import { getGrant } from "@/lib/grant-store"
import type { Email } from "@/lib/types"
import { stripHtmlFromBody } from "@/lib/attachment-parser"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params
    const queryGrantId = request.nextUrl.searchParams.get("grant_id")
    const grant = getGrant()
    const envGrantId = process.env.NYLAS_GRANT_ID
    const grantId = queryGrantId || grant?.grantId || envGrantId

    if (!grantId) {
      return NextResponse.json(
        { error: "No email connected" },
        { status: 400 }
      )
    }

    const nylas = getNylasClient()
    const msg = await nylas.messages.find({
      identifier: grantId,
      messageId,
    })

    const data = msg.data
    const from = data.from?.[0]

    const email: Email = {
      id: data.id,
      from: (from as { name?: string; email?: string })?.name || (from as { email?: string })?.email || "Unknown",
      fromEmail: (from as { email?: string })?.email || "",
      subject: data.subject || "(No subject)",
      snippet: data.snippet || stripHtmlFromBody(data.body).slice(0, 100) + "...",
      body: stripHtmlFromBody(data.body),
      htmlBody: data.body || "",
      date: data.date
        ? new Date(data.date * 1000).toISOString()
        : new Date().toISOString(),
      read: !data.unread,
      starred: data.starred ?? false,
      labels: data.folders || [],
      attachments: (data.attachments || []).map((a: { id: string; filename: string; contentType: string; size?: number }) => ({
        id: a.id,
        filename: a.filename,
        contentType: a.contentType,
        size: a.size ?? 0,
      })),
    }

    return NextResponse.json(email)
  } catch (err) {
    console.error("Nylas message fetch error:", err)
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    )
  }
}
