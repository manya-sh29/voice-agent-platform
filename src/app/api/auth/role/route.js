import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing userId" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .single();

        if (error && error.code !== "PGRST116") {
            throw error;
        }

        return new Response(JSON.stringify({ role: data?.role || "user" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function POST(req) {
    try {
        const { userId, role } = await req.json();

        if (!userId || !role) {
            return new Response(
                JSON.stringify({ error: "Missing userId or role" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const { data, error } = await supabase
            .from("user_roles")
            .upsert([{ user_id: userId, role }], { onConflict: "user_id" })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, role: data.role }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
