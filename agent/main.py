"""
MailVox Voice Agent - LiveKit voice assistant for email inbox.
"""
import logging
import os

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    cli,
    inference,
    metrics,
    room_io,
)
from livekit.plugins import silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from tools.email_tools import (
    get_attachment_content,
    get_email_content,
    list_emails,
    search_emails,
)

logger = logging.getLogger("mailvox-agent")
load_dotenv()

INSTRUCTIONS = """You are MailVox, a voice assistant for the user's email inbox.

Keep responses concise and natural for voice - short sentences, no markdown or bullet points unless summarizing lists.
Do not use emojis, asterisks, or special formatting.

When answering questions about emails:
- Use list_emails to find relevant messages (unread, with attachments, or search).
- Use get_email_content to read a specific email's body.
- Use get_attachment_content when the user asks about PDF or document contents - you need the message_id and attachment_id from the email.

If processing will take a minute or more (e.g. analyzing many attachments), tell the user: "This will take a minute or two. I'll have the answer for you as soon as it's ready." Then provide the reply when done.

Be helpful and proactive. If the user asks something vague like "what's new?", check unread emails and summarize the most relevant ones."""


class MailVoxAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=INSTRUCTIONS,
            tools=[list_emails, get_email_content, get_attachment_content, search_emails],
        )

    async def on_enter(self):
        # Proactive inbox brief on connect (Bar-raiser feature 1)
        # Ask the LLM to check inbox and give a brief - it will use list_emails tool
        try:
            self.session.generate_reply(
                "The user just connected. First call list_emails with unread=True. "
                "Then give a friendly 15-20 second personalized brief: greeting, unread count, "
                "and top 2 actionable items. End with 'Would you like me to expand on any of these?'",
                allow_interruptions=True,
            )
        except Exception as e:
            logger.warning(f"Proactive brief error: {e}")
            self.session.generate_reply(allow_interruptions=False)


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session()
async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    session = AgentSession(
        stt=inference.STT("deepgram/nova-3", language="multi"),
        llm=inference.LLM("openai/gpt-4.1-mini"),
        tts=inference.TTS("cartesia/sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
        resume_false_interruption=True,
        false_interruption_timeout=1.0,
    )

    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    await session.start(
        agent=MailVoxAgent(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(),
        ),
    )


if __name__ == "__main__":
    cli.run_app(server)
