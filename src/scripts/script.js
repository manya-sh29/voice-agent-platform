import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { pipeline } from "@xenova/transformers";

/* -------------------- LOAD ENV -------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
});

/* -------------------- ENV VALIDATION -------------------- */

const {
  OPENAI_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SERVICE_USER_ID,
} = process.env;

if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing in .env.local");
if (!NEXT_PUBLIC_SUPABASE_URL)
  throw new Error("NEXT_PUBLIC_SUPABASE_URL missing in .env.local");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
if (!SUPABASE_SERVICE_USER_ID)
  throw new Error("SUPABASE_SERVICE_USER_ID missing in .env.local");

console.log("✅ Environment variables loaded");

/* -------------------- CLIENTS -------------------- */

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/* -------------------- LOAD SENTENCE TRANSFORMER -------------------- */

console.log("⏳ Loading embedding model...");
const embedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2"
);
console.log("✅ Embedding model loaded");

/* -------------------- CONSTANTS -------------------- */

const DATA_FOLDER = path.resolve(__dirname, "../data");
const CHUNK_SIZE = 500;

/* -------------------- PDF TEXT EXTRACTION -------------------- */

async function extractTextFromPDF(buffer) {
  const uint8Array = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
  });

  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(" ") + " ";
  }

  return fullText;
}

/* -------------------- TEXT CHUNKING -------------------- */

function chunkText(text, size = CHUNK_SIZE) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
}

/* -------------------- CREATE EMBEDDING FUNCTION -------------------- */

async function createEmbedding(text) {
  const output = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data); // Convert to normal JS array
}

/* -------------------- MAIN PROCESS -------------------- */

async function processPDFs() {
  try {
    const USER_ID = SUPABASE_SERVICE_USER_ID;

    // Fetch Agent
    const { data: agents, error: agentError } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", USER_ID)
      .limit(1);

    if (agentError) throw agentError;
    if (!agents || agents.length === 0)
      throw new Error("No agent found for this user.");

    const AGENT_ID = agents[0].id;

    if (!fs.existsSync(DATA_FOLDER))
      throw new Error(`Data folder does not exist: ${DATA_FOLDER}`);

    const files = fs
      .readdirSync(DATA_FOLDER)
      .filter((file) => file.endsWith(".pdf"));

    if (files.length === 0)
      throw new Error("No PDF files found in data folder.");

    for (const file of files) {
      console.log(`📄 Processing: ${file}`);

      const filePath = path.join(DATA_FOLDER, file);
      const buffer = fs.readFileSync(filePath);

      const text = await extractTextFromPDF(buffer);
      if (!text.trim()) {
        console.log(`⚠ Empty PDF skipped: ${file}`);
        continue;
      }

      const chunks = chunkText(text);
      console.log(`🔹 Total chunks: ${chunks.length}`);

      const records = [];

      for (const chunk of chunks) {
        const embedding = await createEmbedding(chunk);

        records.push({
          agent_id: AGENT_ID,
          user_id: USER_ID,
          content: chunk,
          embedding,
        });
      }

      // Batch insert
      const { error: insertError } = await supabase
        .from("knowledge_embeddings")
        .insert(records);

      if (insertError) throw insertError;

      console.log(`✅ Finished processing: ${file}`);
    }

    console.log("🎉 All PDFs processed successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

processPDFs();
