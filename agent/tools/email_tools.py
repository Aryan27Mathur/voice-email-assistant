"""
Email tools for the voice agent. Call Next.js API which proxies to Nylas.
"""
import json
import logging
import os
from typing import Any

import httpx
from livekit.agents import RunContext, function_tool

logger = logging.getLogger("mailvox-agent")

# Next.js API base URL - configurable for different environments
API_BASE = os.getenv("MAILVOX_API_URL", "http://localhost:3000")


def _get_grant_id(ctx: RunContext) -> str:
    """Extract grant_id from room participant metadata or env."""
    grant_id = os.getenv("NYLAS_GRANT_ID", "")
    try:
        room = ctx.room
        if room and room.remote_participants:
            for pid, p in room.remote_participants.items():
                if p.metadata:
                    try:
                        meta = json.loads(p.metadata)
                        if meta.get("grant_id"):
                            return meta["grant_id"]
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        logger.warning(f"Could not read grant from participant metadata: {e}")
    return grant_id


async def _api_get(path: str, params: dict[str, Any] | None = None) -> dict | list:
    """GET request to Next.js API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{API_BASE}{path}", params=params or {})
        resp.raise_for_status()
        return resp.json()


@function_tool()
async def list_emails(
    ctx: RunContext,
    unread: bool | None = None,
    has_attachment: bool | None = None,
    search_query: str | None = None,
) -> str:
    """List emails from the user's inbox.

    Args:
        unread: If True, return only unread emails.
        has_attachment: If True, return only emails that have attachments.
        search_query: Optional search query (provider-specific, Google/Microsoft only).
    """
    grant_id = _get_grant_id(ctx)
    if not grant_id:
        return "No email account is connected. Please connect your inbox first via the web app."

    params: dict[str, Any] = {"grant_id": grant_id}
    if unread is not None:
        params["unread"] = "true" if unread else "false"
    if has_attachment is not None:
        params["hasAttachment"] = "true" if has_attachment else "false"
    if search_query:
        params["search"] = search_query

    try:
        if hasattr(ctx, "session") and ctx.session:
            await ctx.session.say("Searching your inbox...")
        data = await _api_get("/api/nylas/messages", params)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            return "No email account is connected. Please connect your inbox first."
        logger.exception("list_emails error")
        return "Failed to fetch emails. Please try again."
    except Exception as e:
        logger.exception("list_emails error")
        return f"Error fetching emails: {e}"

    if not data:
        return "Your inbox is empty." if unread else "No emails match your criteria."

    items = data[:10]  # Limit for voice
    parts = []
    for i, m in enumerate(items, 1):
        from_name = m.get("from", "Unknown")
        subject = m.get("subject", "(No subject)")[:60]
        unread_mark = " (unread)" if not m.get("read", True) else ""
        parts.append(f"{i}. From {from_name}: {subject}{unread_mark}")
    return "\n".join(parts)


@function_tool()
async def get_email_content(ctx: RunContext, message_id: str) -> str:
    """Get the full body and details of a specific email.

    Args:
        message_id: The Nylas message ID (from list_emails).
    """
    grant_id = _get_grant_id(ctx)
    if not grant_id:
        return "No email account is connected."

    try:
        data = await _api_get(
            f"/api/nylas/messages/{message_id}",
            {"grant_id": grant_id},
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return "Email not found."
        logger.exception("get_email_content error")
        return "Failed to fetch the email."
    except Exception as e:
        logger.exception("get_email_content error")
        return f"Error: {e}"

    from_name = data.get("from", "Unknown")
    subject = data.get("subject", "(No subject)")
    body = data.get("body", "").strip() or "(No body)"
    date = data.get("date", "")
    attachments = data.get("attachments", [])

    result = f"From: {from_name}\nSubject: {subject}\nDate: {date}\n\n{body[:2000]}"
    if len(body) > 2000:
        result += "\n...[truncated]"
    if attachments:
        result += f"\n\nAttachments: {', '.join(a.get('filename', '') for a in attachments)}"
    return result


@function_tool()
async def get_attachment_content(
    ctx: RunContext,
    message_id: str,
    attachment_id: str,
) -> str:
    """Get the extracted text content of an email attachment (PDF, DOCX).
    Use when the user asks about attachment contents. For large files, inform the user it may take a minute.

    Args:
        message_id: The email message ID.
        attachment_id: The attachment ID from the email.
    """
    grant_id = _get_grant_id(ctx)
    if not grant_id:
        return "No email account is connected."

    try:
        if hasattr(ctx, "session") and ctx.session:
            await ctx.session.say("Analyzing the attachment...")
        data = await _api_get(
            f"/api/nylas/attachments/{message_id}/{attachment_id}/content",
            {"grant_id": grant_id},
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return "Attachment not found."
        logger.exception("get_attachment_content error")
        return "Failed to fetch attachment content."
    except Exception as e:
        logger.exception("get_attachment_content error")
        return f"Error: {e}"

    content = data.get("content", "")
    if not content or content.startswith("[") and "]" in content:
        return content  # May be error message like [Unsupported format...]
    return content[:4000] + ("...[truncated]" if len(content) > 4000 else "")


@function_tool()
async def search_emails(ctx: RunContext, query: str) -> str:
    """Search the user's inbox by query. Uses provider-native search (Google/Microsoft).

    Args:
        query: The search query (e.g. 'from:sarah revenue report').
    """
    grant_id = _get_grant_id(ctx)
    if not grant_id:
        return "No email account is connected."

    try:
        data = await _api_get(
            "/api/nylas/messages",
            {"search": query, "grant_id": grant_id},
        )
    except Exception as e:
        logger.exception("search_emails error")
        return f"Search failed: {e}"

    if not data:
        return f"No emails found for: {query}"

    items = data[:8]
    parts = []
    for i, m in enumerate(items, 1):
        from_name = m.get("from", "Unknown")
        subject = m.get("subject", "(No subject)")[:50]
        parts.append(f"{i}. {from_name}: {subject}")
    return "\n".join(parts)
