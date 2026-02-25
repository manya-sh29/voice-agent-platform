import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "txt";

    const { data, error } = await supabase
      .from("voice_logs")
      .select("user_message, ai_response, call_start")
      .eq("id", id)
      .single();

    if (error || !data) {
      return new Response("Transcript not found", { status: 404 });
    }

    const dateStr = data.call_start ? new Date(data.call_start).toLocaleString() : "";

    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text(`Call Transcript - ${dateStr}`, 20, 20);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(`User: ${data.user_message || "(empty)"}\n\nAI: ${data.ai_response || "(empty)"}`, 170);
      doc.text(lines, 20, 35);
      const pdfBuffer = doc.output("arraybuffer");

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=transcript-${id}.pdf`,
        },
      });
    }

    const transcript = `User: ${data.user_message || ""}\n\nAI: ${data.ai_response || ""}`;
    return new Response(transcript, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename=transcript-${id}.txt`,
      },
    });
  } catch (err) {
    return new Response("Something went wrong", { status: 500 });
  }
}
