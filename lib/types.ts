export interface EmailAttachment {
  id: string
  filename: string
  contentType: string
  size: number
}

export interface Email {
  id: string
  from: string
  fromEmail: string
  subject: string
  snippet: string
  body: string
  date: string
  read: boolean
  starred: boolean
  labels: string[]
  attachments: EmailAttachment[]
}

export interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isProcessing?: boolean
}

export type AgentStatus = "idle" | "listening" | "processing" | "speaking"
