import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const PARSE_TIMEOUT_MS = 30000 // 30s

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&shy;/g, "")
}

function stripHtml(html: string): string {
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return decodeEntities(text)
}

export async function parseAttachmentContent(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<string> {
  if (buffer.length > MAX_SIZE_BYTES) {
    return `[File too large to parse: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)]`
  }

  const isPdf =
    contentType.includes("pdf") || filename.toLowerCase().endsWith(".pdf")
  const isDocx =
    contentType.includes("word") ||
    contentType.includes("document") ||
    filename.toLowerCase().endsWith(".docx") ||
    filename.toLowerCase().endsWith(".doc")

  try {
    if (isPdf) {
      const parser = new PDFParse({ data: buffer })
      try {
        const result = await Promise.race([
          parser.getText(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Parse timeout")), PARSE_TIMEOUT_MS)
          ),
        ])
        return result.text || `[No extractable text in ${filename}]`
      } finally {
        await parser.destroy()
      }
    }

    if (isDocx) {
      const result = await Promise.race([
        mammoth.extractRawText({ buffer }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Parse timeout")), PARSE_TIMEOUT_MS)
        ),
      ])
      return result.value || `[No extractable text in ${filename}]`
    }

    return `[Unsupported format for text extraction: ${filename} (${contentType})]`
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return `[Error parsing ${filename}: ${msg}]`
  }
}

export function stripHtmlFromBody(html: string | undefined): string {
  if (!html) return ""
  return stripHtml(html)
}
