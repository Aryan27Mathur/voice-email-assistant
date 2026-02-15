import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"
import { getGrant } from "@/lib/grant-store"

export async function POST(request: NextRequest) {
  try {
    const livekitUrl = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!livekitUrl || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET." },
        { status: 500 }
      )
    }

    const grant = getGrant()
    const envGrantId = process.env.NYLAS_GRANT_ID
    const grantId = grant?.grantId || envGrantId || ""

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `user-${Date.now()}`,
      name: grant?.email || "User",
      metadata: JSON.stringify({ grant_id: grantId }),
    })

    at.addGrant({
      roomJoin: true,
      room: "mailvox-room",
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    // TokenSource endpoint format - support both snake_case and camelCase for compatibility
    return NextResponse.json(
      {
        server_url: livekitUrl,
        participant_token: token,
        serverUrl: livekitUrl,
        participantToken: token,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("LiveKit token error:", err)
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    )
  }
}
