"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import type { Email } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Star,
  Paperclip,
  Search,
  Inbox,
  ChevronLeft,
  ChevronRight,
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
  emails: Email[]
  selectedEmail: Email | null
  onSelectEmail: (email: Email) => void
  collapsed: boolean
  onToggleCollapse: () => void
  loading?: boolean
  nylasConnected?: boolean
  onConnectEmail?: () => void
}

export function EmailSidebar({
  emails,
  selectedEmail,
  onSelectEmail,
  collapsed,
  onToggleCollapse,
  loading = false,
  nylasConnected = true,
  onConnectEmail,
}: EmailSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unreadCount = emails.filter((e) => !e.read).length

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
            {emails.slice(0, 10).map((email) => (
              <Button
                key={email.id}
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-9 justify-center",
                  selectedEmail?.id === email.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
                onClick={() => onSelectEmail(email)}
                aria-label={`Email from ${email.from}: ${email.subject}`}
              >
                <Avatar
                  className={cn(
                    "w-7 h-7 text-xs",
                    !email.read
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <AvatarFallback>{email.from[0]}</AvatarFallback>
                </Avatar>
              </Button>
            ))}
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
            placeholder="Search emails..."
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

      {/* Email list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="flex flex-col">
          {filteredEmails.map((email) => (
            <button
              key={email.id}
              type="button"
              className={cn(
                "w-full text-left py-3 px-4 border-b border-border transition-colors",
                selectedEmail?.id === email.id
                  ? "bg-primary/5"
                  : "hover:bg-secondary/50",
                !email.read && "bg-primary/[0.03]"
              )}
              onClick={() => onSelectEmail(email)}
            >
              <div className="flex items-start gap-3 min-w-0">
                <Avatar
                  className={cn(
                    "w-8 h-8 shrink-0 mt-0.5",
                    !email.read
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <AvatarFallback className="text-xs">
                    {email.from[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm truncate flex-1 min-w-0",
                        !email.read
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/80"
                      )}
                    >
                      {email.from}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {email.starred && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                      {email.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(email.date), {
                          addSuffix: false,
                        })}
                      </span>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "text-xs truncate mt-0.5",
                      !email.read
                        ? "text-foreground/90"
                        : "text-muted-foreground"
                    )}
                  >
                    {email.subject}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-1 leading-relaxed">
                    {email.snippet}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
