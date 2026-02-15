import { NextResponse } from "next/server"
import { getNylasClient } from "@/lib/nylas"

export async function POST() {
  try {
    const nylas = getNylasClient()
    const clientId = process.env.NYLAS_CLIENT_ID
    const redirectUri =
      process.env.NYLAS_REDIRECT_URI || "http://localhost:3000/api/nylas/callback"

    if (!clientId) {
      return NextResponse.json(
        { error: "NYLAS_CLIENT_ID is not configured" },
        { status: 500 }
      )
    }

    const authUrl = nylas.auth.urlForOAuth2({
      clientId,
      redirectUri,
      accessType: "offline",
    })

    return NextResponse.json({ url: authUrl })
  } catch (err) {
    console.error("Nylas auth error:", err)
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    )
  }
}
