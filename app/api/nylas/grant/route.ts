import { NextRequest, NextResponse } from "next/server"
import { getGrant } from "@/lib/grant-store"

export async function GET(request: NextRequest) {
  try {
    const grant = getGrant()
    const envGrantId = process.env.NYLAS_GRANT_ID
    
    if (grant) {
      return NextResponse.json({
        grantId: grant.grantId,
        email: grant.email,
        source: "memory",
      })
    }
    
    if (envGrantId) {
      return NextResponse.json({
        grantId: envGrantId,
        email: null,
        source: "environment",
      })
    }
    
    return NextResponse.json(
      { error: "No grant found" },
      { status: 404 }
    )
  } catch (err) {
    console.error("Grant status error:", err)
    return NextResponse.json(
      { error: "Failed to get grant status" },
      { status: 500 }
    )
  }
}
