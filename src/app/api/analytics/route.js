import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseDuration(str) {
  if (!str || typeof str !== "string") return 0;
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let query = supabase
      .from("voice_logs")
      .select("id, call_duration, call_start, call_status, user_message, ai_response")
      .order("call_start", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: calls, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const list = calls || [];

    const totalCalls = list.length;
    const durations = list.map((c) => parseDuration(c.call_duration));
    const totalSeconds = durations.reduce((a, b) => a + b, 0);
    const avgDurationSeconds = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;
    const completedCalls = list.filter((c) => c.call_status === "completed").length;
    const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const callsToday = list.filter((c) => c.call_start && new Date(c.call_start) >= today).length;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = list.filter((c) => {
        const t = c.call_start ? new Date(c.call_start) : null;
        return t && t >= d && t < next;
      }).length;
      last7Days.push({ date: d.toISOString().slice(0, 10), calls: count });
    }

    let usageQuery = supabase.from("api_usage").select("tokens_used");
    if (userId) {
      usageQuery = usageQuery.eq("user_id", userId);
    }
    const { data: usageData } = await usageQuery;
    const totalTokensUsed = usageData ? usageData.reduce((sum, record) => sum + (record.tokens_used || 0), 0) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        analytics: {
          totalCalls,
          callsToday,
          avgDurationSeconds,
          avgDurationFormatted: `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`,
          successRate,
          callsOverTime: last7Days,
          totalTokensUsed,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
