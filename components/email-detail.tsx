"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import DOMPurify from "dompurify"
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
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

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
  const sanitizedHtml = useMemo(() => {
    if (!email.htmlBody) return null
    return DOMPurify.sanitize(email.htmlBody, {
      ALLOWED_TAGS: [
        "p", "br", "b", "i", "em", "strong", "u", "a", "ul", "ol", "li",
        "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
        "table", "thead", "tbody", "tr", "td", "th", "img", "div", "span",
        "hr", "sub", "sup",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "width", "height", "target", "rel", "style"],
    })
  }, [email.htmlBody])

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
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
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={onClose}
          aria-label="Close email detail"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="px-4 py-4">
          {/* Sender info */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="w-10 h-10 shrink-0 bg-primary/15">
              <AvatarFallback className="text-sm font-semibold text-primary">
                {email.from[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{email.from}</p>
              <p className="text-xs text-muted-foreground break-all">{email.fromEmail}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(email.date), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {/* Labels */}
          {email.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {email.labels.map((label) => (
                <Badge key={label} variant="secondary" className="text-[11px]">
                  {label}
                </Badge>
              ))}
            </div>
          )}

          {/* Body */}
          {sanitizedHtml ? (
            <div
              className="email-body text-sm text-foreground/85 leading-relaxed break-words overflow-hidden"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : (
            <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
              {email.body}
            </div>
          )}

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
                  <Card
                    key={att.id}
                    className="flex items-center gap-3 px-3 py-2.5 flex-row"
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
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
