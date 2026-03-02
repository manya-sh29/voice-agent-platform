# Voice Agent Platform (VoiceAI)

An AI-powered Voice Agent Platform that enables users to create, configure, and interact with intelligent voice agents directly from the browser.
The platform allows real-time voice conversations using a complete Speech-to-Text → LLM → Text-to-Speech pipeline, while also providing agent management, knowledge base integration, call analytics, and performance insights.


# Core Features 

## Authentication- Secure user registration and login
- Session management using Supabase Auth
- Protected routes (dashboard inaccessible without login)
- Persistent authentication state


## AI Agent Management
- Create custom voice agents
- Use predefined templates
- Each agent have its own knowledge base


## Knowledge Base Integration
Upload PDF and TXT documents
Attach documents to specific agents
Enables domain-specific AI assistants


## Real-Time Voice Calling
Browser-based push-to-talk voice interaction:
Record voice from browser
Convert speech to text using Deepgram (STT)
Process response using Groq (LLM)
Convert AI response to speech using ElevenLabs (TTS)


## Full real-time AI conversation pipeline:
```
User Voice → STT → LLM → TTS → AI Voice Response
```

## Call History & Transcripts
- Store complete conversation logs
- View call transcripts
- Track call duration
- Export transcripts as: -TXT or PDF


## Analytics Dashboard
- Total number of calls
- Average call duration
- Calls over time (trend tracking)
- Agent usage insights
- Performance visualization

## AI Call Scorecard
Automatic evaluation of conversations including:
- Overall quality rating
- Sentiment analysis
- Conversation summary


## Project Setup

### Requirements

Make sure you have:

- Node.js 18+
- A Supabase account
- API keys from:

        - Groq (LLM)

        - Deepgram (STT)

        - ElevenLabs (TTS)

        - LiveKit (WebRTC)


# Installation
## Clone repository

```
https://github.com/manya-sh29/voice-agent-platform.git

cd voice-agent-platform

npm install

set .env.local

Edit .env.local with your credentials:

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
GROQ_API_KEY=gsk_...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...

# LiveKit
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_URL=wss://...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000


Start the development server
npm run dev
http://localhost:3000

```

# Tech Stack

### Frontend
- **Framework:** Next.js 
- **Styling:** Tailwind CSS

### Backend
- **API:** Next.js API Routes
- **Database:** Supabase 
- **ORM & Auth:** Supabase JavaScript client + Supabase Auth (JWT)

### AI / ML
- **STT (Speech-to-Text):** Deepgram 
- **LLM (Text Generation):** Groq
- **TTS (Text-to-Speech):** ElevenLabs 

### Real-time & Communication
- **WebRTC / Voice Calls:** LiveKit
- **Audio Processing:** Web Audio API




# Folder Structure

```

voice-agent-platform/
│
├── .next/
├── node_modules/
├── public/
│
├── src/
│   ├── app/
│   │   ├── account/
│   │   │   └── page.js
│   │   │
│   │   ├── agents/
│   │   │   ├── [id]/
│   │   │   └── page.js
│   │   │
│   │   ├── analytics/
│   │   │   └── page.js
│   │   │
│   │   ├── api/
│   │   │   ├── account/delete/
│   │   │   ├── admin/
│   │   │   │   ├── logs/
│   │   │   │   └── users/
│   │   │   ├── agents/[id]/route.js
│   │   │   ├── analytics/route.js
│   │   │   ├── auth/role/route.js
│   │   │   ├── call-history/route.js
│   │   │   ├── call-scorecard/[id]/route.js
│   │   │   ├── export-transcript/[id]/route.js
│   │   │   ├── knowledge/upload/route.js
│   │   │   ├── livekit-token/route.js
│   │   │   └── voice/route.js
│   │   │
│   │   ├── auth/
│   │   │   └── page.js
│   │   │
│   │   ├── call-history/
│   │   │   └── page.js
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── VoiceAgentContext.js
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.js
│   │   │
│   │   ├── profile/
│   │   │   └── page.js
│   │   │
│   │   ├── voice/
│   │   │
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   │
│   ├── components/
│   │   ├── Button.js
│   │   ├── Footer.js
│   │   ├── Navbar.js
│   │   ├── ProtectedRoute.js
│   │   └── VoiceRecorder.js
│   │
│   ├── data/
│   ├── lib/
│   │   └── supabaseClient.js
│   └── scripts/
│
├── supabase/
│   └── migrations/
│       └── add_user_id_to_voice_logs.sql
│
├── .env.local
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tailwind.config.ts
└── README.md

```


# Project Flow

```
User
  │
  ▼
[LiveKit]
  │ Captures audio & publishes to LiveKit Room
  ▼
[LiveKit Room / Server]
  │ Streams audio to backend server
  ▼
[Server]
  │ Sends audio to Deepgram → gets transcript
  ▼
[Knowledge Base]
  │ Retrieves context for response
  ▼
[Groq / AI Engine]
  │ Generates AI response
  ▼
[ElevenLabs TTS]
  │ Converts AI text to speech
  ▼
[Server]
  │ Streams audio back to LiveKit
  ▼
[LiveKit]
  │ Plays AI-generated audio
  ▼
User


```

# Database Structure

This project uses Supabase to store user, agent, and voice interaction data. The following tables have been created:

```
## Database Tables

| Table Name              | Description                                                    | Rows | Size  | Columns |
|-------------------------|----------------------------------------------------------------|------|-------|---------|
|   agents                | Stores all voice agents created by users along with settings.  | 81   | 72 kB | 7       |
|   api_usage             | No description available.                                      | 13   | 32 kB | 6       |
| knowledge_embeddings    | No description available.                                      | 4    | 48 kB | 6       |
|     voice_logs          | No description available.                                      | 21   | 32 kB | 11      |

```

These tables handle:
- Creation and configuration of AI voice agents (agents).
- Tracking API usage and system activity (api_usage).
- Storing knowledge embeddings for AI responses (knowledge_embeddings).
- Logging all voice interactions and related metadata (voice_logs).



# Project Flow

```

1. **Agent Selection**
   - User selects an agent from the **Agent Templates Library** on the dashboard.
   - Each agent has predefined settings and system prompts.

2. **Voice Recording**
   - User clicks **Start Recording** to speak with the agent.
   - LiveKit captures the audio in real-time and streams it to the server.
   - User clicks **Stop Recording** when done.

3. **Audio Processing**
   - The user voice is recorded.
   - Aferthat **Deepgram** performs real-time speech-to-text (STT).
   - The system uses knowledge base to fetch relevant knowledge from the database.
   - **Groq** generates the agent’s response based on the user query and retrieved knowledge.
   - **ElevenLabs** converts the response text into audio.
   - Audio is streamed back to the user via **LiveKit**.

4. **Viewing Responses**
   - User sees the **transcript** of their conversation.
   - User hears the **agent’s audio reply**.
   - Both transcript and audio are saved in the database under **voice_logs**.

5. **Call History**
   - User can navigate to **Call History** from the dashboard.
   - Previous voice interactions are listed with options to:
     - Check teh agent, date, time, call duration.
     - Download transcripts in **.txt** and **.pdf** formats.

6. **Analytics & Performance**
   - Users can view **call analytics**, such as:
     - Number of calls
     - Duration of calls
     - Agent performance metrics
   - Helps in evaluating how efficiently agents are responding to queries.

7. **Repeat Interaction**
   - Users can go back to the dashboard, select another agent, and repeat the voice interaction process.


```