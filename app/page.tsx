"use client"

import { useState, useCallback } from "react"
import type { Email, ConversationMessage, AgentStatus } from "@/lib/types"
import { mockEmails } from "@/lib/mock-data"
import { EmailSidebar } from "@/components/email-sidebar"
import { VoiceOrb } from "@/components/voice-orb"
import { ConversationPanel } from "@/components/conversation-panel"
import { EmailDetail } from "@/components/email-detail"
import { TextInput } from "@/components/text-input"
import { StatusBar } from "@/components/status-bar"
import { Mail, PanelLeftOpen, PanelLeftClose } from "lucide-react"

const SIMULATED_RESPONSES: Record<string, string> = {
  default:
    "I found some relevant information in your inbox. Let me pull that up for you.",
  unread:
    "You have 2 unread emails. One from Sarah Chen about the Q4 Revenue Report, and another from Marcus Johnson with updated brand guidelines. Would you like me to read either of them?",
  attachments:
    "Looking through your inbox, I see several emails with attachments:\n\n1. Sarah Chen sent Q4_Revenue_Report_2025.pdf and revenue_data.xlsx\n2. Marcus Johnson sent Brand_Guidelines_v3.pdf\n3. Emily Rodriguez sent a Partnership_Proposal and market_analysis.pptx\n4. Lisa Park sent the NDA_Apex_Redlined.docx\n5. Alex Kim sent invoice INV-2026-0214.pdf\n\nWould you like me to summarize any of these?",
  revenue:
    "Based on the Q4 Revenue Report from Sarah Chen, the numbers look strong:\n\n- Total revenue: $4.2M (23% increase over Q3)\n- New customer acquisition: 156 accounts\n- Churn rate decreased to 2.1%\n\nShe mentioned there's a board meeting on Thursday. Would you like me to draft a reply?",
  urgent:
    "You have one urgent email from Lisa Park regarding an NDA review. The NDA for the Apex deal needs your review by end of day. She flagged two clauses: Section 4.2 about non-compete scope and Section 7.1 about the termination clause. The document needs to be signed by Friday.",
  partnership:
    "Emily Rodriguez from TechStart sent a partnership proposal. The key points are:\n\n- Joint go-to-market strategy for enterprise clients\n- Shared API integration\n- Co-branded marketing campaigns\n\nShe's requesting a call next Tuesday at 2 PM. Would you like me to check your calendar?",
}

function getSimulatedResponse(query: string): string {
  const q = query.toLowerCase()
  if (q.includes("unread") || q.includes("new email") || q.includes("what's new"))
    return SIMULATED_RESPONSES.unread
  if (
    q.includes("attachment") ||
    q.includes("file") ||
    q.includes("document")
  )
    return SIMULATED_RESPONSES.attachments
  if (
    q.includes("revenue") ||
    q.includes("q4") ||
    q.includes("report") ||
    q.includes("sarah")
  )
    return SIMULATED_RESPONSES.revenue
  if (
    q.includes("urgent") ||
    q.includes("nda") ||
    q.includes("lisa") ||
    q.includes("legal")
  )
    return SIMULATED_RESPONSES.urgent
  if (
    q.includes("partner") ||
    q.includes("techstart") ||
    q.includes("emily") ||
    q.includes("proposal")
  )
    return SIMULATED_RESPONSES.partnership
  return SIMULATED_RESPONSES.default
}

export default function Page() {
  const [emails] = useState<Email[]>(mockEmails)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [status, setStatus] = useState<AgentStatus>("idle")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showEmailDetail, setShowEmailDetail] = useState(false)

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string, isProcessing = false) => {
      const msg: ConversationMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
        timestamp: new Date(),
        isProcessing,
      }
      setMessages((prev) => [...prev, msg])
      return msg.id
    },
    []
  )

  const simulateAgentResponse = useCallback(
    (query: string) => {
      setStatus("processing")
      const processingId = addMessage("assistant", "", true)

      // Simulate processing time
      setTimeout(() => {
        const response = getSimulatedResponse(query)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === processingId
              ? { ...m, content: response, isProcessing: false }
              : m
          )
        )
        setStatus("speaking")

        // Simulate speaking duration
        setTimeout(() => {
          setStatus("idle")
        }, 2000 + response.length * 20)
      }, 1500 + Math.random() * 1000)
    },
    [addMessage]
  )

  const handleVoiceToggle = useCallback(() => {
    if (status === "idle") {
      setStatus("listening")
      // Simulate voice input after a delay
      setTimeout(() => {
        const voiceQueries = [
          "What unread emails do I have?",
          "Tell me about any emails with attachments",
          "What does the Q4 revenue report say?",
          "Do I have any urgent emails?",
          "Summarize the partnership proposal from Emily",
        ]
        const randomQuery =
          voiceQueries[Math.floor(Math.random() * voiceQueries.length)]
        addMessage("user", randomQuery)
        simulateAgentResponse(randomQuery)
      }, 2500)
    } else if (status === "listening") {
      setStatus("idle")
    }
  }, [status, addMessage, simulateAgentResponse])

  const handleTextSend = useCallback(
    (text: string) => {
      addMessage("user", text)
      simulateAgentResponse(text)
    },
    [addMessage, simulateAgentResponse]
  )

  const handleSelectEmail = useCallback((email: Email) => {
    setSelectedEmail(email)
    setShowEmailDetail(true)
  }, [])

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Email Sidebar - hidden on mobile by default */}
      <div className="hidden md:flex">
        <EmailSidebar
          emails={emails}
          selectedEmail={selectedEmail}
          onSelectEmail={handleSelectEmail}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0">
        <StatusBar status={status} connected={true} />

        {/* Header bar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle email sidebar"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-sm font-semibold text-foreground">
                MailVox
              </h1>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Voice-powered email assistant
          </p>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Voice orb zone */}
          <div className="flex items-center justify-center py-8 md:py-10 shrink-0 bg-gradient-to-b from-card to-background">
            <VoiceOrb status={status} onClick={handleVoiceToggle} />
          </div>

          {/* Conversation */}
          <ConversationPanel messages={messages} />

          {/* Text input */}
          <TextInput
            onSend={handleTextSend}
            disabled={status === "processing" || status === "speaking"}
          />
        </div>
      </main>

      {/* Email detail panel */}
      {showEmailDetail && selectedEmail && (
        <div className="hidden lg:flex w-96">
          <EmailDetail
            email={selectedEmail}
            onClose={() => setShowEmailDetail(false)}
          />
        </div>
      )}

      {/* Mobile email detail overlay */}
      {showEmailDetail && selectedEmail && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card shadow-xl">
            <EmailDetail
              email={selectedEmail}
              onClose={() => setShowEmailDetail(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
