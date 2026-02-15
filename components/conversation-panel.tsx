"use client"

import { useEffect, useRef } from "react"
import type { ConversationMessage } from "@/lib/types"
import { cn } from "@/lib/utils"
import { User, Bot, Loader2 } from "lucide-react"

interface ConversationPanelProps {
  messages: ConversationMessage[]
}

export function ConversationPanel({ messages }: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
          <Bot className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
          Start a conversation by clicking the orb above or typing below. Ask about your emails, attachments, or anything in your inbox.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 md:px-6 py-4"
      role="log"
      aria-label="Conversation transcript"
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-secondary-foreground rounded-bl-sm"
              )}
            >
              {msg.isProcessing ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing your emails...</span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              <time className="block text-[10px] mt-1.5 opacity-50">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-foreground/70" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
