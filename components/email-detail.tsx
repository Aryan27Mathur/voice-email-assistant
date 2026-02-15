"use client"

import { format } from "date-fns"
import type { Email } from "@/lib/types"
import {
  X,
  Star,
  Paperclip,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
} from "lucide-react"

interface EmailDetailProps {
  email: Email
  onClose: () => void
}

function getFileIcon(contentType: string) {
  if (contentType.includes("pdf"))
    return <FileText className="w-4 h-4 text-red-400" />
  if (contentType.includes("spreadsheet") || contentType.includes("excel"))
    return <FileSpreadsheet className="w-4 h-4 text-accent" />
  if (contentType.includes("presentation"))
    return <Presentation className="w-4 h-4 text-amber-400" />
  if (contentType.includes("word"))
    return <FileText className="w-4 h-4 text-primary" />
  return <File className="w-4 h-4 text-muted-foreground" />
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EmailDetail({ email, onClose }: EmailDetailProps) {
  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {email.subject}
          </h3>
          {email.starred && (
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
          )}
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Close email detail"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Sender info */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {email.from[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{email.from}</p>
            <p className="text-xs text-muted-foreground">{email.fromEmail}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(email.date), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        {/* Labels */}
        {email.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {email.labels.map((label) => (
              <span
                key={label}
                className="px-2 py-0.5 bg-secondary text-muted-foreground text-[11px] font-medium rounded-md"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
          {email.body}
        </div>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 mb-3">
              <Paperclip className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {email.attachments.length} Attachment
                {email.attachments.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {email.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-secondary rounded-lg"
                >
                  {getFileIcon(att.contentType)}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {att.filename}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFileSize(att.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
