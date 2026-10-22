import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import zlib from "zlib";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to extract text from .docx files without extra dependencies
function extractDocxText(buffer) {
  try {
    let offset = 0;
    while (offset < buffer.length - 30) {
      if (buffer.readUInt32LE(offset) === 0x04034b50) {
        const compression = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const nameLen = buffer.readUInt16LE(offset + 26);
        const extraLen = buffer.readUInt16LE(offset + 28);
        const fileName = buffer.toString("utf8", offset + 30, offset + 30 + nameLen);
        const dataOffset = offset + 30 + nameLen + extraLen;
        if (fileName === "word/document.xml") {
          const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);
          const xml = compression === 8 ? zlib.inflateRawSync(compressedData).toString("utf8") : compressedData.toString("utf8");
          return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        }
        offset = dataOffset + compressedSize;
      } else {
        offset++;
      }
    }
  } catch (e) {
    console.warn("Failed to extract docx text:", e);
  }
  return null;
}

// Helper to process each selected file into appropriate Gemini parts
async function processSelectedFile(file) {
  try {
    if (!file.downloadUrl) {
      return { text: `[Knowledge Bank Document: "${file.name}" - Missing download URL]` };
    }

    const res = await fetch(file.downloadUrl);
    if (!res.ok) {
      return { text: `[Knowledge Bank Document: "${file.name}" - Could not retrieve file (HTTP ${res.status})]` };
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = (file.type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();

    // 1. Text-based files (plain text, markdown, code, csv, json, etc.)
    const isText =
      mime.startsWith("text/") ||
      mime === "application/json" ||
      /\.(txt|md|markdown|csv|json|js|jsx|ts|tsx|py|html|css|xml|yaml|yml|sql|sh|env|log)$/i.test(name);

    if (isText) {
      const text = buffer.toString("utf-8");
      return {
        text: `--- Start of Knowledge Bank Document: "${file.name}" ---\n${text}\n--- End of Knowledge Bank Document: "${file.name}" ---`,
      };
    }

    // 2. Word documents (.docx)
    if (name.endsWith(".docx")) {
      const docxText = extractDocxText(buffer);
      if (docxText) {
        return {
          text: `--- Start of Knowledge Bank Document: "${file.name}" ---\n${docxText}\n--- End of Knowledge Bank Document: "${file.name}" ---`,
        };
      }
    }

    // 3. PDF documents
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      return {
        inlineData: {
          mimeType: "application/pdf",
          data: buffer.toString("base64"),
        },
      };
    }

    // 4. Image documents
    if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(name)) {
      const imgMime = mime.startsWith("image/")
        ? mime
        : name.endsWith(".png")
        ? "image/png"
        : name.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
      return {
        inlineData: {
          mimeType: imgMime,
          data: buffer.toString("base64"),
        },
      };
    }

    // 5. Audio documents
    if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(name)) {
      const audioMime = mime.startsWith("audio/") ? mime : "audio/mp3";
      return {
        inlineData: {
          mimeType: audioMime,
          data: buffer.toString("base64"),
        },
      };
    }

    // Fallback: check if readable as UTF-8 text
    const sample = buffer.toString("utf-8", 0, Math.min(buffer.length, 500));
    const isPrintable = !/[\x00-\x08\x0E-\x1F]/.test(sample);
    if (isPrintable) {
      return {
        text: `--- Start of Knowledge Bank Document: "${file.name}" ---\n${buffer.toString("utf-8")}\n--- End of Knowledge Bank Document: "${file.name}" ---`,
      };
    }

    return {
      text: `[Knowledge Bank Document: "${file.name}" attached, but binary format could not be directly parsed]`,
    };
  } catch (err) {
    console.error(`Error processing file "${file.name}":`, err);
    return {
      text: `[Knowledge Bank Document: "${file.name}" - Failed to load: ${err.message}]`,
    };
  }
}

// Helper to sanitize any stray LaTeX syntax or collapsed table formatting
function cleanOutputFormatting(text) {
  if (!text || typeof text !== "string") return text;
  let cleaned = text;

  // Separate collapsed table rows (e.g. | ... | | :--- |)
  cleaned = cleaned.replace(/\|\s*\|\s*/g, "|\n| ");

  // Resolve LaTeX \frac{a}{b} -> (a / b)
  let prev;
  let depth = 0;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1 / $2)");
    depth++;
  } while (cleaned !== prev && depth < 10);

  // Clean common LaTeX commands
  cleaned = cleaned
    .replace(/\\text\{([^{}]+)\}/g, "$1")
    .replace(/\\left\(/g, "(")
    .replace(/\\right\)/g, ")")
    .replace(/\\left\[/g, "[")
    .replace(/\\right\]/g, "]")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\sum/g, "∑")
    .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)")
    .replace(/\$\$([\s\S]*?)\$\$/g, (m, formula) => `\n\n> **${formula.trim()}**\n\n`)
    .replace(/\$([^$\n]+)\$/g, "$1");

  return cleaned;
}

export async function POST(req) {
  try {
    const { messages, selectedFiles } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const hasSelectedFiles = Array.isArray(selectedFiles) && selectedFiles.length > 0;

    const formattingRules = `
CRITICAL FORMATTING INSTRUCTIONS:
- NEVER output raw LaTeX syntax or dollar signs (do NOT use $, $$, \\text, \\frac, \\times, \\left, \\right, \\sum, \\sqrt). The chat UI does NOT support LaTeX rendering.
- Write math equations and variables in natural, readable plain text and Unicode symbols (e.g. "Median = L + [(N/2 - CF) / f] * h", "f = 19", "N/2 = 50 / 2 = 25", "×", "÷", "∑", "√").
- When generating tables, ALWAYS place each row on its own new line with proper Markdown table divider (| :--- | :--- |). Never collapse rows onto the same line.
`;

    let systemInstruction = "";
    if (hasSelectedFiles) {
      systemInstruction = `You are Study Buddy, an intelligent study assistant.
The user has provided reference document(s) from their Knowledge Bank: ${selectedFiles.map((f) => `"${f.name}"`).join(", ")}.

CRITICAL INSTRUCTIONS:
1. When answering the user's questions, ONLY use the content from these provided Knowledge Bank documents along with your own general knowledge.
2. If the user asks about topics covered in their documents, prioritize and reference the content from these documents accurately.
3. Do NOT invent, assume, or reference any other files outside of the ones provided in this Knowledge Bank.
4. If the question cannot be answered from the provided documents, answer helpfully using your own knowledge and clearly mention that the documents do not cover it.
5. Format your answers clearly using markdown (lists, bolding, code blocks where appropriate).
${formattingRules}`;
    } else {
      systemInstruction = `You are Study Buddy, an intelligent and encouraging study assistant.
Answer the user's questions helpfully, accurately, and clearly using your general knowledge.
Format your responses using markdown.
${formattingRules}`;
    }

    let formattedHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    while (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
      formattedHistory.shift();
    }

    const latestMessage = messages[messages.length - 1].content;

    let messagePayload;
    if (hasSelectedFiles) {
      const fileParts = await Promise.all(selectedFiles.map((file) => processSelectedFile(file)));
      messagePayload = [
        {
          text: `[Knowledge Bank Context: ${selectedFiles.length} file(s) attached: ${selectedFiles.map((f) => f.name).join(", ")}]`,
        },
        ...fileParts,
        { text: latestMessage },
      ];
    } else {
      messagePayload = latestMessage;
    }

    const modelsToTry = [
      "gemini-3.5-flash-lite"
    ];
    let responseText = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
        });

        const chat = model.startChat({
          history: formattedHistory,
        });

        const result = await chat.sendMessage(messagePayload);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err) {
        console.warn(`Model ${modelName} encountered an error:`, err?.message || err);
        lastError = err;
        // Continue to the next candidate model if service is busy or model unavailable
        const isTransient =
          err?.status === 503 ||
          err?.status === 429 ||
          err?.status === 404 ||
          (err?.message && (err.message.includes("503") || err.message.includes("404") || err.message.includes("demand")));
        if (!isTransient) {
          throw err;
        }
      }
    }

    if (!responseText) {
      const isHighDemand = lastError?.status === 503 || lastError?.message?.includes("503");
      const userMessage = isHighDemand
        ? "The AI service is currently experiencing temporary high demand from Google's servers. Please try sending your question again in a moment."
        : lastError?.message || "Failed to generate response from Gemini.";

      return NextResponse.json({ error: userMessage }, { status: 503 });
    }

    return NextResponse.json({ reply: cleanOutputFormatting(responseText) });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate response from Gemini." },
      { status: 500 }
    );
  }
}