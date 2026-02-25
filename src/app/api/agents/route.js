import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VOICE_OPTIONS = [
  { id: "default", name: "Default" },
  { id: "rachel", name: "Rachel" },
  { id: "drew", name: "Drew" },
  { id: "clyde", name: "Clyde" },
  { id: "paul", name: "Paul" },
  { id: "domi", name: "Domi" },
];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("agents")
      .select("id, name, description, system_prompt, knowledge_base, voice, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, agents: data || [], voiceOptions: VOICE_OPTIONS }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, name, description, system_prompt, voice = "default" } = body;

    if (!userId || !name || !system_prompt) {
      return new Response(
        JSON.stringify({ error: "userId, name, and system_prompt are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("agents")
      .insert([{
        user_id: userId,
        name,
        description: description || "",
        system_prompt,
        voice,
        knowledge_base: "",
      }])
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, agent: data }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
