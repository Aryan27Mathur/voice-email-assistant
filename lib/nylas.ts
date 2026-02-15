import Nylas from "nylas"

const apiKey = process.env.NYLAS_API_KEY
if (!apiKey) {
  console.warn("NYLAS_API_KEY is not set - Nylas features will be disabled")
}

export const nylas = apiKey
  ? new Nylas({ apiKey })
  : null

export function getNylasClient() {
  if (!nylas) {
    throw new Error("Nylas is not configured. Set NYLAS_API_KEY in .env")
  }
  return nylas
}
