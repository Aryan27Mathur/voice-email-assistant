import { NextResponse } from "next/server"
import { AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk"
import { ParticipantInfo_Kind } from "@livekit/protocol"
import { getGrant } from "@/lib/grant-store"

const ROOM_NAME = "mailvox-room"
const AGENT_NAME = "mailvox"

export async function POST() {
  try {
    const livekitUrl = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!livekitUrl || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 500 }
      )
    }

    const grant = getGrant()
    const envGrantId = process.env.NYLAS_GRANT_ID
    const grantId = grant?.grantId || envGrantId || ""

    const apiUrl = livekitUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:")

    // Check if an agent is already live in the room (not just dispatched)
    try {
      const roomClient = new RoomServiceClient(apiUrl, apiKey, apiSecret)
      const participants = await roomClient.listParticipants(ROOM_NAME)
      const agentAlive = participants.some(
        (p) => p.kind === ParticipantInfo_Kind.AGENT
      )
      if (agentAlive) {
        console.log("Agent already active in room, skipping dispatch")
        return NextResponse.json({ ok: true, reused: true }, { status: 200 })
      }
    } catch {
      // Room doesn't exist yet — that's fine, proceed to dispatch
    }

    const dispatchClient = new AgentDispatchClient(apiUrl, apiKey, apiSecret)
    await dispatchClient.createDispatch(ROOM_NAME, AGENT_NAME, {
      metadata: JSON.stringify({ grant_id: grantId }),
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error("Agent dispatch error:", err)
    return NextResponse.json(
      { error: "Failed to dispatch agent" },
      { status: 500 }
    )
  }
}
