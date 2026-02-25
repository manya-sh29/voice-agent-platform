import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let query = supabase
      .from("voice_logs")
      .select(`
        id,
        file_name,
        user_message,
        ai_response,
        agent_id,
        call_start,
        call_end,
        call_duration,
        call_status
      `)
      .order("call_start", { ascending: false });

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let agentNames = {};
    if (data?.length) {
      const agentIds = [...new Set(data.map((c) => c.agent_id).filter(Boolean))];
      if (agentIds.length) {
        const { data: agents } = await supabase
          .from("agents")
          .select("id, name")
          .in("id", agentIds);
        (agents || []).forEach((a) => (agentNames[a.id] = a.name));
      }
    }

    const formattedData = (data || []).map((call) => ({
      ...call,
      agent_name: call.agent_id ? (agentNames[call.agent_id] || `Agent ${call.agent_id}`) : "Default",
    }));

    return new Response(
      JSON.stringify({ success: true, calls: formattedData }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
