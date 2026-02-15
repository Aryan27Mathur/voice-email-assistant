"use client"

import type { AgentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Mic, Volume2, Loader2, MicOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface StatusBarProps {
  status: AgentStatus
  connected: boolean
  emailsLoading?: boolean
}

export function StatusBar({ status, connected, emailsLoading }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-card shrink-0">
      {/* Left: Connection status */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            connected ? "bg-accent" : "bg-destructive"
          )}
        />
        <Badge
          variant="secondary"
          className="text-[11px] font-medium h-5 px-1.5 py-0 normal-case"
        >
          {emailsLoading
            ? "Connecting..."
            : connected
              ? "Connected to Nylas"
              : "Demo mode (mock data)"}
        </Badge>
      </div>

      {/* Center: Agent status */}
      <Badge
        variant="outline"
        className="flex items-center gap-1.5 text-[11px] font-medium h-6 px-2 py-0 capitalize"
      >
        {status === "idle" && <MicOff className="w-3.5 h-3.5 text-muted-foreground" />}
        {status === "listening" && (
          <Mic className="w-3.5 h-3.5 text-primary animate-pulse" />
        )}
        {status === "processing" && (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
        )}
        {status === "speaking" && (
          <Volume2 className="w-3.5 h-3.5 text-accent" />
        )}
        {status}
      </Badge>

      {/* Right: Voice engine label */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground font-medium font-mono">
          Pipecat
        </span>
        <Separator
          orientation="vertical"
          className="h-3 w-px bg-muted-foreground/40"
          decorative
        />
        <span className="text-[11px] text-muted-foreground font-medium font-mono">
          LiveKit
        </span>
      </div>
    </div>
  )
}
