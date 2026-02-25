# Voice Agent Platform

AI-powered voice agent platform with browser-based voice calling, agent management, knowledge base, and analytics.

## Features

- **Authentication**: Register, login, logout
- **Agents**: Create from templates, edit, delete
- **Knowledge Base**: Upload PDF/TXT documents
- **Voice Calling**: Push-to-talk recording with STT → LLM → TTS pipeline
- **Call History**: View transcripts, export TXT/PDF
- **Analytics**: Total calls, average duration, calls over time
- **Call Scorecard**: Quality rating, sentiment, key topics

## Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

3. **Database migration (Supabase)**

Run in Supabase SQL Editor to add `user_id` to voice logs:

```sql
ALTER TABLE voice_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
```

4. **Run development server**

```bash
npm run dev
```

## Troubleshooting

- **No AI response / "Processing failed"**: Check GROQ_API_KEY, ELEVENLABS_API_KEY, ELEVEN_VOICE_ID, and DEEPGRAM_API_KEY. Try `GROQ_MODEL=llama-3.1-8b-instant` in `.env.local`.
- **Call history empty**: Run the migration above. Ensure `voice_recordings` bucket exists in Supabase Storage.

## Tech Stack

- Next.js, React, Tailwind CSS
- Supabase (Auth + PostgreSQL)
- Groq (LLM)
- Deepgram (STT)
- ElevenLabs (TTS)
