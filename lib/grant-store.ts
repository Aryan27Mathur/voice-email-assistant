/**
 * Simple in-memory grant store for local development.
 * In production, use a database (e.g. PostgreSQL, Redis).
 */
const grants = new Map<string, { grantId: string; email: string }>()

const SESSION_ID = "default" // For single-user local dev

export function setGrant(sessionId: string, grantId: string, email: string) {
  grants.set(sessionId, { grantId, email })
}

export function getGrant(sessionId: string = SESSION_ID): {
  grantId: string
  email: string
} | null {
  return grants.get(sessionId) ?? null
}

export function clearGrant(sessionId: string = SESSION_ID) {
  grants.delete(sessionId)
}
