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
} from "lucide-react"

interface EmailSidebarProps {
  emails: Email[]
  selectedEmail: Email | null
  onSelectEmail: (email: Email) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function EmailSidebar({
  emails,
  selectedEmail,
  onSelectEmail,
  collapsed,
  onToggleCollapse,
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
      <aside className="flex flex-col items-center w-14 border-r border-border bg-card py-4 gap-4 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="relative flex items-center justify-center w-9 h-9">
          <Inbox className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto w-full px-1.5">
          {emails.slice(0, 10).map((email) => (
            <button
              key={email.id}
              onClick={() => onSelectEmail(email)}
              className={cn(
                "w-full flex items-center justify-center h-9 rounded-md mb-1 transition-colors",
                selectedEmail?.id === email.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary text-muted-foreground"
              )}
              aria-label={`Email from ${email.from}: ${email.subject}`}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                  !email.read
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {email.from[0]}
              </div>
            </button>
          ))}
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex flex-col w-80 lg:w-96 border-r border-border bg-card shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-primary/15 text-primary text-[11px] font-semibold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm bg-secondary rounded-md border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.map((email) => (
          <button
            key={email.id}
            onClick={() => onSelectEmail(email)}
            className={cn(
              "w-full text-left px-4 py-3 border-b border-border transition-colors",
              selectedEmail?.id === email.id
                ? "bg-primary/5"
                : "hover:bg-secondary/50",
              !email.read && "bg-primary/[0.03]"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5",
                  !email.read
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {email.from[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm truncate",
                      !email.read
                        ? "font-semibold text-foreground"
                        : "font-medium text-foreground/80"
                    )}
                  >
                    {email.from}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {email.starred && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    )}
                    {email.attachments.length > 0 && (
                      <Paperclip className="w-3 h-3 text-muted-foreground" />
                    )}
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
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-muted-foreground truncate pr-2 leading-relaxed">
                    {email.snippet.substring(0, 60)}...
                  </p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(email.date), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
