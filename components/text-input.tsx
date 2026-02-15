"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

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
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or ask about your emails..."
          disabled={disabled}
          rows={1}
          className="min-h-0 resize-none bg-secondary rounded-lg py-2.5 leading-relaxed"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || disabled}
          className="w-9 h-9 shrink-0 rounded-lg"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
