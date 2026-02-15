import { NextRequest, NextResponse } from "next/server"
import { getNylasClient } from "@/lib/nylas"
import { getGrant } from "@/lib/grant-store"

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
    const buffer = await nylas.attachments.downloadBytes({
      identifier: grantId,
      attachmentId,
      queryParams: { messageId },
    })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    })
  } catch (err) {
    console.error("Nylas attachment download error:", err)
    return NextResponse.json(
      { error: "Failed to download attachment" },
      { status: 500 }
    )
  }
}
