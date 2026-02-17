"use client"

import { useState, useCallback } from "react"
import { formatDistanceToNow } from "date-fns"
import type { Email, EmailThread } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Star,
  Paperclip,
  Search,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

function ConnectEmailButton({ onConnect }: { onConnect: () => void }) {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/nylas/auth", { method: "POST" })
      const { url } = await res.json()
      if (url) window.location.href = url
      else onConnect()
    } catch {
      onConnect()
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="w-full gap-2 text-xs h-8"
    >
      <Link2 className="w-3.5 h-3.5" />
      {loading ? "Redirecting..." : "Connect email"}
    </Button>
  )
}

interface EmailSidebarProps {
  threads: EmailThread[]
  selectedEmail: Email | null
  onSelectEmail: (email: Email) => void
  collapsed: boolean
  onToggleCollapse: () => void
  loading?: boolean
  nylasConnected?: boolean
  onConnectEmail?: () => void
  fallbackEmails?: Email[]
}

export function EmailSidebar({
  threads,
  selectedEmail,
  onSelectEmail,
  collapsed,
  onToggleCollapse,
  loading = false,
  nylasConnected = true,
  onConnectEmail,
  fallbackEmails,
}: EmailSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<Record<string, Email[]>>({})
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null)

  const filteredThreads = threads.filter(
    (t) =>
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.participants.some(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  const unreadCount = threads.filter((t) => t.unread).length

  const fetchThreadMessages = useCallback(
    async (threadId: string, messageIds: string[]) => {
      if (threadMessages[threadId]?.length) return
      if (fallbackEmails && messageIds.length > 0) {
        const msgs = messageIds
          .map((id) => fallbackEmails!.find((e) => e.id === id))
          .filter((e): e is Email => !!e)
        if (msgs.length > 0) {
          setThreadMessages((prev) => ({ ...prev, [threadId]: msgs }))
          return
        }
      }
      setLoadingThreadId(threadId)
      try {
        const res = await fetch(`/api/nylas/messages?thread_id=${threadId}&limit=50`)
        if (res.ok) {
          const data = await res.json()
          setThreadMessages((prev) => ({ ...prev, [threadId]: data }))
        }
      } finally {
        setLoadingThreadId(null)
      }
    },
    [threadMessages, fallbackEmails]
  )

  const handleToggleExpand = useCallback(
    (thread: EmailThread) => {
      const next = expandedThreadId === thread.id ? null : thread.id
      setExpandedThreadId(next)
      if (next && thread.messageIds.length > 0) {
        fetchThreadMessages(next, thread.messageIds)
      }
    },
    [expandedThreadId, fetchThreadMessages]
  )

  const getLatestFrom = (thread: EmailThread) => {
    const p = thread.participants[0]
    return p?.name || p?.email || "Unknown"
  }

  const getEmailById = useCallback(
    (id: string): Email | undefined => {
      if (fallbackEmails) {
        return fallbackEmails.find((e) => e.id === id)
      }
      return undefined
    },
    [fallbackEmails]
  )

  const selectEmailById = useCallback(
    (id: string) => {
      const cached = getEmailById(id)
      if (cached) {
        onSelectEmail(cached)
        return
      }
      fetch(`/api/nylas/messages/${id}`)
        .then((r) => r.json())
        .then((e) => onSelectEmail(e))
        .catch(() => {})
    },
    [getEmailById, onSelectEmail]
  )

  if (collapsed) {
    return (
      <aside className="flex flex-col items-center w-full bg-card py-4 gap-4 shrink-0 h-full">
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          onClick={onToggleCollapse}
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="relative flex items-center justify-center w-9 h-9">
          <Inbox className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
        <ScrollArea className="flex-1 w-full px-1.5">
          <div className="flex flex-col gap-1">
            {threads.slice(0, 10).map((thread) => {
              const msgs = threadMessages[thread.id]
              const firstMsg = msgs?.[0]
              const isSelected =
                selectedEmail &&
                (thread.messageIds.includes(selectedEmail.id) ||
                  (firstMsg && selectedEmail.id === firstMsg.id))
              return (
                <Button
                  key={thread.id}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-full h-9 justify-center",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  )}
                  onClick={() => {
                    if (msgs?.[0]) onSelectEmail(msgs[0])
                    else if (thread.messageIds[0]) {
                      selectEmailById(thread.messageIds[0])
                    }
                  }}
                  aria-label={`Thread: ${thread.subject}`}
                >
                  <Avatar
                    className={cn(
                      "w-7 h-7 text-xs",
                      !thread.unread
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <AvatarFallback>
                      {getLatestFrom(thread)[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </aside>
    )
  }

  return (
    <aside className="flex flex-col w-full bg-card h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[11px]">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            className="h-8 pl-8 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Connect prompt when not connected */}
      {!nylasConnected && onConnectEmail && (
        <div className="px-3 py-3 border-b border-border bg-primary/5">
          <p className="text-xs text-muted-foreground mb-2">
            Connect your inbox for real email data.
          </p>
          <ConnectEmailButton onConnect={onConnectEmail} />
        </div>
      )}

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="flex flex-col">
          {filteredThreads.map((thread) => {
            const isExpanded = expandedThreadId === thread.id
            const msgs = threadMessages[thread.id]
            const isLoading = loadingThreadId === thread.id

            return (
              <div
                key={thread.id}
                className="border-b border-border"
              >
                {/* Thread row */}
                <div
                  className={cn(
                    "flex items-start gap-2 py-3 px-4 cursor-pointer transition-colors",
                    selectedEmail && thread.messageIds.includes(selectedEmail.id)
                      ? "bg-primary/5"
                      : "hover:bg-secondary/50",
                    !thread.unread && "bg-primary/[0.03]"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 shrink-0 mt-0.5 -ml-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleExpand(thread)
                    }}
                    aria-label={isExpanded ? "Collapse thread" : "Expand thread"}
                  >
                    {thread.messageIds.length > 1 ? (
                      isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <span className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </Button>
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => {
                      if (thread.messageIds.length === 1 && !msgs?.length) {
                        handleToggleExpand(thread)
                        selectEmailById(thread.messageIds[0])
                      } else if (msgs?.[0]) {
                        onSelectEmail(msgs[0])
                      } else if (thread.messageIds[0]) {
                        selectEmailById(thread.messageIds[0])
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar
                        className={cn(
                          "w-8 h-8 shrink-0 mt-0.5",
                          !thread.unread
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        <AvatarFallback className="text-xs">
                          {getLatestFrom(thread)[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm truncate flex-1 min-w-0",
                              !thread.unread
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80"
                            )}
                          >
                            {getLatestFrom(thread)}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {thread.starred && (
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            )}
                            {thread.hasAttachments && (
                              <Paperclip className="w-3 h-3 text-muted-foreground" />
                            )}
                            {thread.needsReply && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                Needs reply
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p
                          className={cn(
                            "text-xs truncate mt-0.5",
                            !thread.unread
                              ? "text-foreground/90"
                              : "text-muted-foreground"
                          )}
                        >
                          {thread.subject}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-1 leading-relaxed">
                          {thread.snippet}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded messages */}
                {isExpanded && (
                  <div className="pl-4 pr-2 pb-2 border-l-2 border-border ml-6">
                    {isLoading ? (
                      <p className="text-xs text-muted-foreground py-2">
                        Loading...
                      </p>
                    ) : msgs && msgs.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {msgs.map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            className={cn(
                              "w-full text-left py-2 px-3 rounded text-xs transition-colors",
                              selectedEmail?.id === msg.id
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectEmail(msg)
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {msg.from}
                              </span>
                              <span className="text-[10px] shrink-0">
                                {formatDistanceToNow(new Date(msg.date), {
                                  addSuffix: false,
                                })}
                              </span>
                            </div>
                            <p className="truncate mt-0.5">{msg.snippet}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground py-2">
                        No messages
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
