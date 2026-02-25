import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { createClient as createDeepgramClient } from "@deepgram/sdk";
import axios from "axios";

console.log("SERVICE KEY LOADED:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// -------------------- Supabase --------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -------------------- Groq --------------------
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// -------------------- Deepgram --------------------
const deepgram = createDeepgramClient(process.env.DEEPGRAM_API_KEY);

// -------------------- ElevenLabs --------------------
const VOICE_ID = process.env.ELEVEN_VOICE_ID;
const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;

export const POST = async (req) => {
  try {
    console.log("POST /api/voice called");

    const callStart = new Date();

    const formData = await req.formData();
    const audioFile = formData.get("audio");
    let agentId = formData.get("agentId");
    const contextFromFrontend = formData.get("context");
    const userId = formData.get("userId");

    if (!agentId || agentId === "undefined" || agentId === "null") {
      agentId = null;
    } else if (typeof agentId !== "string") {
      agentId = null;
    }

    console.log(" Final agentId being saved:", agentId);

    if (!audioFile)
      return new Response(JSON.stringify({ error: "No audio file sent" }), {
        status: 400,
      });

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `voice-${Date.now()}.webm`;

    // -------------------- Upload to Supabase --------------------
    const { error: uploadError } = await supabase.storage
      .from("voice-recordings")
      .upload(fileName, buffer, { contentType: "audio/webm", upsert: false });

    if (uploadError)
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
      });

    // -------------------- Deepgram STT --------------------
    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        mimetype: "audio/webm",
        model: "nova-2",
        punctuate: true,
      }
    );

    const userText =
      result?.results?.channels[0]?.alternatives?.[0]?.transcript?.trim() ||
      "Hello";

    // -------------------- Fetch agent info --------------------
    let systemPrompt = "You are a helpful AI assistant.";
    let knowledgeContext = "";

    if (agentId !== null) {
      const { data: agent } = await supabase
        .from("agents")
        .select("system_prompt, knowledge_base")
        .eq("id", agentId)
        .maybeSingle();

      if (agent) {
        systemPrompt = agent.system_prompt || systemPrompt;
        knowledgeContext = agent.knowledge_base || "";
      }
    }

    const antiGenericInstruction = `
CRITICAL: Give specific, actionable answers. Never use generic phrases.
Answer the user's question directly and thoroughly. Use the Knowledge Base when relevant.
Keep responses concise for voice (2-4 sentences).`;

    const fullSystemPrompt = [
      systemPrompt.trim(),
      antiGenericInstruction,
      knowledgeContext ? `\nKnowledge Base:\n${knowledgeContext}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const previousMessages = contextFromFrontend
      ? JSON.parse(contextFromFrontend)
      : [];

    const messages = [
      { role: "system", content: fullSystemPrompt },
      ...previousMessages,
      { role: "user", content: userText },
    ];

    // -------------------- Call Groq --------------------
    const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const completion = await groq.chat.completions.create({
      model: groqModel,
      messages,
    });

    const aiResponse =
      completion?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't respond.";

    
    try {
      await supabase.from("api_usage").insert([
        {
          user_id: userId || null,
          agent_id: agentId,
          endpoint: "/api/voice",
          tokens_used: completion?.usage?.total_tokens || 0,
        },
      ]);
      console.log(" API usage stored");
    } catch (usageError) {
      console.error("API usage insert error:", usageError);
    }

    // -------------------- Generate TTS --------------------
    let base64Audio = null;

    try {
      const elevenResponse = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          text: aiResponse,
          model_id: "eleven_multilingual_v2",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVEN_API_KEY,
          },
          responseType: "arraybuffer",
        }
      );

      base64Audio = Buffer.from(elevenResponse.data).toString("base64");
    } catch (ttsErr) {
      console.error(
        " ElevenLabs TTS error:",
        ttsErr.response?.data?.toString() || ttsErr.message
      );
    }

    // -------------------- Log to Supabase --------------------
    const callEnd = new Date();

    const { error: insertError } = await supabase
      .from("voice_logs")
      .insert([
        {
          file_name: fileName,
          bucket: "voice-recordings",
          user_message: userText,
          ai_response: aiResponse,
          agent_id: agentId,
          user_id: userId || null,
          call_start: callStart,
          call_end: callEnd,
          call_duration: `${Math.floor(
            (callEnd - callStart) / 1000
          )} seconds`,
          call_status: base64Audio ? "completed" : "TTS_failed",
        },
      ]);

    if (insertError) {
      console.error(" Insert error:", insertError);
    } else {
      console.log("Call saved successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcript: userText,
        reply: aiResponse,
        audio: base64Audio,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(" Voice API error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Voice processing failed" }),
      { status: 500 }
    );
  }
};


