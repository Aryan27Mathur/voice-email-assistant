import { NextRequest, NextResponse } from "next/server"
import { getNylasClient } from "@/lib/nylas"
import { setGrant } from "@/lib/grant-store"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  try {
    const nylas = getNylasClient()
    const clientId = process.env.NYLAS_CLIENT_ID
    const clientSecret = process.env.NYLAS_CLIENT_SECRET
    const redirectUri =
      process.env.NYLAS_REDIRECT_URI || "http://localhost:3000/api/nylas/callback"

    if (!clientId) {
      return NextResponse.redirect(new URL("/?error=config", request.url))
    }

    const response = await nylas.auth.exchangeCodeForToken({
      redirectUri,
      code,
      clientId,
      clientSecret: clientSecret || undefined,
    })

    setGrant("default", response.grantId, response.email)

    return NextResponse.redirect(new URL("/", request.url))
  } catch (err) {
    console.error("Nylas callback error:", err)
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent("Failed to connect email")}`,
        request.url
      )
    )
  }
}
