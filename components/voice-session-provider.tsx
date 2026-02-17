"use client"

import { useMemo } from "react"
import { TokenSource } from "livekit-client"
import {
  useSession,
  useSessionMessages,
  useVoiceAssistant,
  SessionProvider,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react"
import type { AgentStatus } from "@/lib/types"
import type { ConversationMessage } from "@/lib/types"

function mapAgentStateToStatus(
  state: "connecting" | "listening" | "thinking" | "speaking" | "disconnected"
): AgentStatus {
  switch (state) {
    case "listening":
      return "listening"
    case "thinking":
      return "processing"
    case "speaking":
      return "speaking"
    case "connecting":
      // Connected to room but agent hasn't joined yet — show processing, not idle
      return "processing"
    case "disconnected":
    default:
      return "idle"
  }
}

export function useVoiceSession() {
  const tokenSource = useMemo(
    () => TokenSource.endpoint("/api/livekit/token"),
    []
  )
  const session = useSession(tokenSource, {
    roomName: "mailvox-room",
    participantName: "User",
  })
  return session
}

export function useMappedVoiceState() {
  const { state } = useVoiceAssistant()
  return mapAgentStateToStatus(state)
}

export function useMappedMessages(): ConversationMessage[] {
  const { messages } = useSessionMessages()
  return messages.map((m) => {
    const msg = m as { message?: string; from?: { isLocal?: boolean }; id: string; timestamp?: number }
    return {
      id: msg.id,
      role: msg.from?.isLocal ? "user" : "assistant",
      content: msg.message ?? "",
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      isProcessing: false,
    }
  })
}

interface VoiceSessionWrapperProps {
  children: React.ReactNode
}

export function VoiceSessionWrapper({ children }: VoiceSessionWrapperProps) {
  const session = useVoiceSession()
  return (
    <SessionProvider session={session}>
      <RoomAudioRenderer />
      <StartAudio label="Click to allow audio" />
      {children}
    </SessionProvider>
  )
}
