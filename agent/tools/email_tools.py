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

# Grant from job metadata (set by entrypoint). Each job runs in its own process.
_job_grant_id: str = ""


def set_job_grant_id(grant_id: str) -> None:
    """Set grant_id from job dispatch metadata. Called by entrypoint."""
    global _job_grant_id
    _job_grant_id = grant_id


def _get_grant_id(ctx: RunContext) -> str:
    """Extract grant_id from job metadata, participant metadata, or env."""
    # 1. Job metadata (from dispatch) - available immediately, no race with user join
    if _job_grant_id:
        return _job_grant_id
    # 2. Env fallback
    grant_id = os.getenv("NYLAS_GRANT_ID", "")
    # 3. Participant metadata (user token) - may be empty if user hasn't joined yet
    try:
        room = ctx.session.room_io.room
        if room and room.remote_participants:
            for pid, p in room.remote_participants.items():
                if p.metadata:
                    try:
                        meta = json.loads(p.metadata)
                        grant_id_from_meta = meta.get("grant_id", "")
                        if grant_id_from_meta:
                            logger.info(f"Found grant_id from participant metadata: {grant_id_from_meta[:10]}...")
                            return grant_id_from_meta
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        logger.warning(f"Could not read grant from participant metadata: {e}")
    if grant_id:
        logger.info(f"Using grant_id from env: {grant_id[:10]}...")
    else:
        logger.warning("No grant_id found in job metadata, participant metadata, or environment")
    return grant_id


async def _api_get(path: str, params: dict[str, Any] | None = None) -> dict | list:
    """GET request to Next.js API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{API_BASE}{path}", params=params or {})
        resp.raise_for_status()
        return resp.json()


@function_tool()
async def get_current_email_context(ctx: RunContext) -> str:
    """Get the email the user currently has selected in the UI. Use when the user asks about
    'this email', 'the current one', 'the selected email', 'what I'm looking at', etc.
    Returns the message_id and summary so you can call get_email_content for full details."""
    grant_id = _get_grant_id(ctx)
    if not grant_id:
        return "No email account is connected."

    try:
        data = await _api_get("/api/context", {"grant_id": grant_id})
    except Exception as e:
        logger.exception("get_current_email_context error")
        return f"Could not get current email context: {e}"

    if not data or data.get("emailId") is None:
        return "The user has not selected any email. Ask which email they mean or use list_emails to browse."

    email_id = data.get("emailId", "")
    subject = data.get("subject", "(No subject)")
    from_name = data.get("from", "Unknown")
    snippet = (data.get("snippet") or "")[:150]
    return (
        f"The user has selected an email. message_id={email_id}. "
        f"From: {from_name}. Subject: {subject}. Snippet: {snippet}. "
        "Use get_email_content with this message_id for the full body and details."
    )


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
        msg_id = m.get("id", "")
        from_name = m.get("from", "Unknown")
        subject = m.get("subject", "(No subject)")[:60]
        unread_mark = " (unread)" if not m.get("read", True) else ""
        parts.append(f"{i}. [id={msg_id}] From {from_name}: {subject}{unread_mark}")
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
async def list_threads(
    ctx: RunContext,
    unread: bool | None = None,
) -> str:
    """List email threads (conversations) from the user's inbox.

    Args:
        unread: If True, return only threads with unread messages.
    """
    grant_id = _get_grant_id(ctx)
    if not grant_id:
        return "No email account is connected."

    params: dict[str, Any] = {"grant_id": grant_id}
    if unread is not None:
        params["unread"] = "true" if unread else "false"

    try:
        if hasattr(ctx, "session") and ctx.session:
            await ctx.session.say("Fetching threads...")
        data = await _api_get("/api/nylas/threads", params)
    except Exception as e:
        logger.exception("list_threads error")
        return f"Failed to fetch threads: {e}"

    if not data:
        return "No threads found."

    items = data[:10]
    parts = []
    for i, t in enumerate(items, 1):
        thread_id = t.get("id", "")
        subject = (t.get("subject") or "(No subject)")[:50]
        participants = ", ".join(p.get("name", p.get("email", "")) for p in t.get("participants", [])[:2])
        needs = " [needs reply]" if t.get("needsReply") else ""
        parts.append(f"{i}. [thread_id={thread_id}] {subject} - {participants}{needs}")
    return "\n".join(parts)


@function_tool()
async def threads_needing_reply(ctx: RunContext) -> str:
    """List email threads where the user has started a conversation (2+ messages) but the last
    message is from someone else - i.e. the user needs to respond. Use when the user asks about
    'emails I need to respond to', 'pending replies', or 'what needs my response'."""
    grant_id = _get_grant_id(ctx)
    if not grant_id:
        return "No email account is connected."

    try:
        if hasattr(ctx, "session") and ctx.session:
            await ctx.session.say("Checking for threads that need your reply...")
        data = await _api_get("/api/nylas/threads/needs-reply", {"grant_id": grant_id})
    except Exception as e:
        logger.exception("threads_needing_reply error")
        return f"Failed to fetch: {e}"

    if not data:
        return "No threads need your reply right now."

    parts = []
    for i, t in enumerate(data[:8], 1):
        thread_id = t.get("id", "")
        subject = (t.get("subject") or "(No subject)")[:50]
        participants = ", ".join(p.get("name", p.get("email", "")) for p in t.get("participants", [])[:2])
        parts.append(f"{i}. [thread_id={thread_id}] {subject} - {participants}")
    return "Threads needing your reply:\n" + "\n".join(parts)


@function_tool()
async def get_thread_messages(ctx: RunContext, thread_id: str) -> str:
    """Get all messages in an email thread (chain). Use when the user asks about
    the contents of an email chain, 'what did they say in that thread', or similar.

    Args:
        thread_id: The Nylas thread ID (from list_threads or threads_needing_reply).
    """
    grant_id = _get_grant_id(ctx)
    if not grant_id:
        return "No email account is connected."

    try:
        data = await _api_get(
            "/api/nylas/messages",
            {"grant_id": grant_id, "thread_id": thread_id, "limit": "20"},
        )
    except Exception as e:
        logger.exception("get_thread_messages error")
        return f"Failed to fetch thread messages: {e}"

    if not data:
        return f"No messages found in thread {thread_id}."

    parts = []
    for i, m in enumerate(data, 1):
        from_name = m.get("from", "Unknown")
        subject = (m.get("subject") or "(No subject)")[:40]
        snippet = (m.get("snippet") or m.get("body", ""))[:80].strip()
        date = m.get("date", "")
        parts.append(f"{i}. From {from_name}: {subject}\n   {snippet}... [{date}]")
    return "\n".join(parts)


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
        msg_id = m.get("id", "")
        from_name = m.get("from", "Unknown")
        subject = m.get("subject", "(No subject)")[:50]
        parts.append(f"{i}. [id={msg_id}] {from_name}: {subject}")
    return "\n".join(parts)
