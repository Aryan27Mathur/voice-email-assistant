import { NextRequest, NextResponse } from "next/server"
import { getNylasClient } from "@/lib/nylas"
import { getGrant } from "@/lib/grant-store"
import { parseAttachmentContent } from "@/lib/attachment-parser"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string; attachmentId: string }> }
) {
  try {
    const { messageId, attachmentId } = await params
    const queryGrantId = request.nextUrl.searchParams.get("grant_id")
    const grant = getGrant()
    const envGrantId = process.env.NYLAS_GRANT_ID
    const grantId = queryGrantId || grant?.grantId || envGrantId

    if (!grantId) {
      return NextResponse.json({ error: "No email connected" }, { status: 400 })
    }

    const nylas = getNylasClient()

    // Get attachment metadata first
    const metaResponse = await nylas.attachments.find({
      identifier: grantId,
      attachmentId,
      queryParams: { messageId },
    })

    const attachment = metaResponse.data
    const buffer = await nylas.attachments.downloadBytes({
      identifier: grantId,
      attachmentId,
      queryParams: { messageId },
    })

    const text = await parseAttachmentContent(
      Buffer.from(buffer),
      attachment.contentType,
      attachment.filename
    )

    return NextResponse.json({ content: text })
  } catch (err) {
    console.error("Nylas attachment content error:", err)
    return NextResponse.json(
      { error: "Failed to parse attachment content" },
      { status: 500 }
    )
  }
}
