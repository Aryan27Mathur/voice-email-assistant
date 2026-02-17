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
  htmlBody?: string
  date: string
  read: boolean
  starred: boolean
  labels: string[]
  attachments: EmailAttachment[]
  threadId?: string
}

export interface EmailThreadParticipant {
  name: string
  email: string
}

export interface EmailThread {
  id: string
  subject: string
  snippet: string
  messageIds: string[]
  unread: boolean
  starred: boolean
  latestMessageReceivedDate?: number
  latestMessageSentDate?: number
  participants: EmailThreadParticipant[]
  hasAttachments: boolean
  needsReply: boolean
}

export interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isProcessing?: boolean
}

export type AgentStatus = "idle" | "listening" | "processing" | "speaking"
