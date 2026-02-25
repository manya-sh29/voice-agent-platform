import { createClient } from "@supabase/supabase-js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".txt", ".docx"];

async function extractTextFromFile(buffer, mimeType) {
  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }
  if (mimeType === "application/pdf") {
    const uint8 = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + " ";
    }
    return text.trim();
  }
  if (mimeType?.includes("wordprocessingml")) {
    return "[DOCX content extraction requires mammoth - add mammoth package for full support]. Please use PDF or TXT for now.";
  }
  return "";
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const agentId = formData.get("agentId");
    const userId = formData.get("userId");

    if (!file || !agentId) {
      return new Response(
        JSON.stringify({ error: "file and agentId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const name = file.name || "unknown";
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return new Response(
        JSON.stringify({ error: "Only PDF, TXT, and DOCX files are allowed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || (ext === ".pdf" ? "application/pdf" : "text/plain");

    const text = await extractTextFromFile(buffer, mimeType);
    if (!text || text.length < 2) {
      return new Response(
        JSON.stringify({ error: "Could not extract text from file" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: agent } = await supabase
      .from("agents")
      .select("knowledge_base")
      .eq("id", agentId)
      .single();

    const existingKb = agent?.knowledge_base || "";
    const separator = existingKb ? "\n\n---\n\n" : "";
    const newKb = existingKb + separator + `[From ${name}]\n${text.slice(0, 50000)}`;

    const { error } = await supabase
      .from("agents")
      .update({ knowledge_base: newKb })
      .eq("id", agentId);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Knowledge base updated",
        charsAdded: text.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Knowledge upload error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Upload failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
