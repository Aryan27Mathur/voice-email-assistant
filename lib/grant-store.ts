/**
 * File-backed grant store for local development.
 * Persists grants to .grants.json so they survive server restarts.
 * In production, use a database (e.g. PostgreSQL, Redis).
 */
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const GRANTS_FILE = join(process.cwd(), ".grants.json")
const SESSION_ID = "default" // For single-user local dev

type GrantData = Record<string, { grantId: string; email: string }>

function loadGrants(): GrantData {
  try {
    const raw = readFileSync(GRANTS_FILE, "utf-8")
    return JSON.parse(raw) as GrantData
  } catch {
    return {}
  }
}

function saveGrants(grants: GrantData) {
  try {
    writeFileSync(GRANTS_FILE, JSON.stringify(grants, null, 2), "utf-8")
  } catch (e) {
    console.error("Failed to save grants:", e)
  }
}

export function setGrant(sessionId: string, grantId: string, email: string) {
  const grants = loadGrants()
  grants[sessionId] = { grantId, email }
  saveGrants(grants)
  console.log(`Grant stored for session "${sessionId}": ${email} (${grantId.substring(0, 10)}...)`)
}

export function getGrant(sessionId: string = SESSION_ID): {
  grantId: string
  email: string
} | null {
  const grants = loadGrants()
  return grants[sessionId] ?? null
}

export function clearGrant(sessionId: string = SESSION_ID) {
  const grants = loadGrants()
  delete grants[sessionId]
  saveGrants(grants)
}
