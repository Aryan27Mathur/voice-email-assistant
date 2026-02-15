"use client"

import type { AgentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Mic, Volume2, Loader2, MicOff } from "lucide-react"

interface StatusBarProps {
  status: AgentStatus
  connected: boolean
}

export function StatusBar({ status, connected }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-card shrink-0">
      {/* Left: Connection status */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            connected ? "bg-accent" : "bg-destructive"
          )}
        />
        <span className="text-[11px] text-muted-foreground font-medium">
          {connected ? "Connected to Nylas" : "Disconnected"}
        </span>
      </div>

      {/* Center: Agent status */}
      <div className="flex items-center gap-2">
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
        <span className="text-[11px] text-muted-foreground font-medium capitalize">
          {status}
        </span>
      </div>

      {/* Right: Voice engine label */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground font-medium font-mono">
          Pipecat
        </span>
        <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        <span className="text-[11px] text-muted-foreground font-medium font-mono">
          LiveKit
        </span>
      </div>
    </div>
  )
}
