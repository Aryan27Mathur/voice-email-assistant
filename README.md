# MailVox - Voice Email Assistant

A voice-driven personal assistant for your email inbox, built with Next.js, Nylas, and LiveKit Agents.

## Features

- **Voice interface**: Click the orb to start a voice session and ask questions about your emails
- **Email body & attachments**: Query email content and PDF/DOCX attachment text
- **Async reply with ETA**: Agent informs you when processing will take a few minutes and delivers the reply when ready
- **Proactive inbox brief**: On connect, the agent delivers a personalized 15-20 second brief of unread and actionable items
- **Progress feedback**: Spoken updates during long operations (e.g. "Searching your inbox...", "Analyzing the attachment...")

## Prerequisites

- Node.js 18+
- Python 3.10+ (for the voice agent)
- Accounts: [Nylas](https://dashboard.nylas.com), [LiveKit Cloud](https://cloud.livekit.io)

## Setup

### 1. Clone and install

```bash
cd voice-email-assistant
npm install
```

### 2. Environment variables

Copy the example and fill in your credentials:

```bash
cp .env.example .env
```

**Next.js (.env):**
```
# Nylas - https://dashboard.nylas.com
NYLAS_API_KEY=your_api_key
NYLAS_CLIENT_ID=your_client_id
NYLAS_REDIRECT_URI=http://localhost:3000/api/nylas/callback

# LiveKit - https://cloud.livekit.io
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Optional: Pre-connected grant for testing (from Nylas dashboard)
# NYLAS_GRANT_ID=
```

**Agent (agent/.env):**
```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
MAILVOX_API_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key
# NYLAS_GRANT_ID=  # Optional for testing
```

### 3. Nylas configuration

1. Create a Nylas application and add a Google/Microsoft integration
2. Set the redirect URI to `http://localhost:3000/api/nylas/callback`
3. Connect an email account via the "Connect email" button in the sidebar, or set `NYLAS_GRANT_ID` for a pre-connected account

### 4. LiveKit configuration

1. Create a LiveKit Cloud project
2. Copy `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` to both Next.js and agent `.env`
3. The agent uses automatic dispatch (joins when a user connects to the room)

## Running locally

### Terminal 1: Next.js

```bash
npm run dev
```

Open http://localhost:3000

### Terminal 2: Voice agent

```bash
cd agent
pip install -r requirements.txt
# Or: uv sync
python main.py
```

The agent requires API keys for:
- **Deepgram** (STT)
- **OpenAI** (LLM)
- **Cartesia** (TTS)

Set these in `agent/.env` or your environment. See [LiveKit Agents](https://docs.livekit.io/agents/) for configuration.

## Usage

1. **Connect email**: Click "Connect email" in the sidebar to link your inbox via Nylas OAuth
2. **Start voice**: Click the orb to start a voice session; the agent will greet you with a brief
3. **Ask questions**: "What unread emails do I have?", "Summarize the PDF from Sarah", "Search for revenue report"

## Architecture

- **Frontend**: Next.js with LiveKit React components, VoiceOrb, ConversationPanel
- **API**: Next.js API routes proxy Nylas and generate LiveKit tokens
- **Agent**: Python LiveKit Agent with email tools (list, get content, attachment parsing)
- **Email**: Nylas SDK for messages and attachments; pdf-parse and mammoth for PDF/DOCX extraction
