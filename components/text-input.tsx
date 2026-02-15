"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { Send } from "lucide-react"

interface TextInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function TextInput({ onSend, disabled }: TextInputProps) {
  const [value, setValue] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim() && !disabled) {
      onSend(value.trim())
      setValue("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-card px-4 py-3 shrink-0"
    >
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or ask about your emails..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 leading-relaxed"
          />
        </div>
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
