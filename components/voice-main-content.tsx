"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ConnectionState } from "livekit-client"
import { useSessionContext, useSessionMessages } from "@livekit/components-react"
import type { Email, ConversationMessage, AgentStatus } from "@/lib/types"
import { mockEmails } from "@/lib/mock-data"
import { EmailSidebar } from "@/components/email-sidebar"
import { VoiceOrb } from "@/components/voice-orb"
import { ConversationPanel } from "@/components/conversation-panel"
import { EmailDetail } from "@/components/email-detail"
import { TextInput } from "@/components/text-input"
import { StatusBar } from "@/components/status-bar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { Mail, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { useMappedVoiceState, useMappedMessages } from "@/components/voice-session-provider"
import { useIsDesktop } from "@/hooks/use-mobile"

export function VoiceMainContent() {
  const session = useSessionContext()
  const { send } = useSessionMessages()
  const liveKitState = useMappedVoiceState()
  const liveKitMessages = useMappedMessages()
  const isDesktop = useIsDesktop()

  const [emails, setEmails] = useState<Email[]>(mockEmails)
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [nylasConnected, setNylasConnected] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showEmailDetail, setShowEmailDetail] = useState(false)
  const [voiceConnecting, setVoiceConnecting] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const sidebarPanelRef = useRef<ImperativePanelHandle>(null)
  const detailPanelRef = useRef<ImperativePanelHandle>(null)

  const isConnected = session.connectionState === ConnectionState.Connected
  const isConnecting =
    session.connectionState === ConnectionState.Connecting || voiceConnecting
  const status: AgentStatus = isConnected
    ? liveKitState
    : isConnecting
      ? "processing"
      : "idle"

  const messages: ConversationMessage[] = isConnected ? liveKitMessages : []

  const fetchEmails = useCallback(async () => {
    setEmailsLoading(true)
    try {
      const res = await fetch("/api/nylas/messages")
      if (res.ok) {
        const data = await res.json()
        setEmails(data)
        setNylasConnected(true)
      } else {
        setEmails(mockEmails)
        setNylasConnected(false)
      }
    } catch {
      setEmails(mockEmails)
      setNylasConnected(false)
    } finally {
      setEmailsLoading(false)
    }
  }, [])

  const handleConnectEmail = useCallback(async () => {
    try {
      const res = await fetch("/api/nylas/auth", { method: "POST" })
      const { url } = await res.json()
      if (url) window.location.href = url
      else fetchEmails()
    } catch {
      fetchEmails()
    }
  }, [fetchEmails])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const handleVoiceToggle = useCallback(async () => {
    if (isConnected) {
      return // Orb shows state when connected; no toggle off for now
    }
    if (isConnecting) return
    if (status !== "idle") return

    setVoiceError(null)
    setVoiceConnecting(true)
    try {
      await session.start()
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Failed to connect")
      console.error("Voice connection error:", err)
    } finally {
      setVoiceConnecting(false)
    }
  }, [isConnected, isConnecting, status, session])

  const handleTextSend = useCallback(
    async (text: string) => {
      if (isConnected && send) {
        await send(text)
      }
    },
    [isConnected, send]
  )

  const handleSelectEmail = useCallback((email: Email) => {
    setSelectedEmail(email)
    setShowEmailDetail(true)
    detailPanelRef.current?.resize(35)
  }, [])

  const handleCloseEmail = useCallback(() => {
    detailPanelRef.current?.collapse()
    setSelectedEmail(null)
    setShowEmailDetail(false)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    if (sidebarCollapsed) {
      sidebarPanelRef.current?.expand()
    } else {
      sidebarPanelRef.current?.collapse()
    }
  }, [sidebarCollapsed])

  // Desktop: VS Code-style flat resizable layout — [Sidebar | Voice | Detail]
  if (isDesktop) {
    return (
      <div className="flex flex-col h-dvh overflow-hidden bg-background">
        {/* Shared top bar spanning all panels */}
        <StatusBar
          status={status}
          connected={nylasConnected}
          emailsLoading={emailsLoading}
        />
        <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-sm font-semibold text-foreground">MailVox</h1>
          </div>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Voice-powered email assistant
          </p>
        </div>

        {/* Single flat ResizablePanelGroup: [Sidebar] | [Voice] | [Detail] */}
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 min-h-0"
        >
          {/* Email Sidebar */}
          <ResizablePanel
            ref={sidebarPanelRef}
            defaultSize={25}
            minSize={15}
            collapsible
            collapsedSize={0}
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
          >
            <EmailSidebar
              emails={emails}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
              collapsed={false}
              onToggleCollapse={handleToggleSidebar}
              loading={emailsLoading}
              nylasConnected={nylasConnected}
              onConnectEmail={handleConnectEmail}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Voice/Chat — main panel */}
          <ResizablePanel defaultSize={75} minSize={30}>
            <div className="flex flex-col h-full min-w-0">
              <div className="flex-1 flex flex-col overflow-hidden mx-auto w-full max-w-2xl px-4 md:px-6">
                <div className="flex items-center justify-center py-8 md:py-10 shrink-0">
                  <VoiceOrb status={status} onClick={handleVoiceToggle} />
                </div>
                {voiceError && (
                  <p className="text-center text-sm text-destructive px-4 pb-2">
                    {voiceError}
                  </p>
                )}
                <ConversationPanel messages={messages} />
                <TextInput
                  onSend={handleTextSend}
                  disabled={
                    !isConnected ||
                    status === "processing" ||
                    status === "speaking"
                  }
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Email Detail — collapsed by default, expands when email selected */}
          <ResizablePanel
            ref={detailPanelRef}
            defaultSize={0}
            minSize={20}
            collapsible
            collapsedSize={0}
            onCollapse={() => {
              setShowEmailDetail(false)
              setSelectedEmail(null)
            }}
          >
            {selectedEmail && (
              <EmailDetail
                email={selectedEmail}
                onClose={handleCloseEmail}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }

  // Mobile: flex layout with Sheet for email detail
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden md:flex w-80 shrink-0 h-full">
        <EmailSidebar
          emails={emails}
          selectedEmail={selectedEmail}
          onSelectEmail={handleSelectEmail}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          loading={emailsLoading}
          nylasConnected={nylasConnected}
          onConnectEmail={handleConnectEmail}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        <StatusBar
          status={status}
          connected={nylasConnected}
          emailsLoading={emailsLoading}
        />
        <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle email sidebar"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
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

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-center py-8 md:py-10 shrink-0 bg-gradient-to-b from-card to-background">
            <VoiceOrb status={status} onClick={handleVoiceToggle} />
          </div>
          {voiceError && (
            <p className="text-center text-sm text-destructive px-4 pb-2">
              {voiceError}
            </p>
          )}
          <ConversationPanel messages={messages} />
          <TextInput
            onSend={handleTextSend}
            disabled={
              !isConnected || status === "processing" || status === "speaking"
            }
          />
        </div>
      </main>

      <Sheet
        open={showEmailDetail && !!selectedEmail}
        onOpenChange={(open) => !open && setShowEmailDetail(false)}
      >
        <SheetContent
          side="right"
          className="w-full max-w-md p-0 sm:max-w-md [&>button]:hidden"
        >
          {selectedEmail && (
            <EmailDetail
              email={selectedEmail}
              onClose={() => setShowEmailDetail(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
