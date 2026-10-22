import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import pdfParse from "pdf-parse";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function chunkText(text, maxLength = 500, overlap = 50) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    const chunk = text.slice(index, index + maxLength);
    chunks.push(chunk.trim());
    index += maxLength - overlap;
  }
  return chunks.filter(c => c.length > 0);
}

export async function POST(req) {
  try {
    const { userId, docId, downloadUrl, fileType, fileName } = await req.json();

    if (!downloadUrl || !userId || !docId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch file server-side (bypasses browser CORS completely)
    const fileRes = await fetch(downloadUrl);
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let fileText = "";

    // 2. Extract text based on file type
    if (fileType === "application/pdf" || fileName?.endsWith(".pdf")) {
      const parsedPdf = await pdfParse(buffer);
      fileText = parsedPdf.text;
    } else {
      fileText = buffer.toString("utf-8");
    }

    if (!fileText || fileText.trim().length === 0) {
      return NextResponse.json({ error: "Extracted text was empty" }, { status: 400 });
    }

    // 3. Chunk and embed text
    const chunks = chunkText(fileText);

    for (const chunk of chunks) {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: chunk,
      });
      
      const vectorValues = response.embeddings[0].values;

      await addDoc(collection(db, `users/${userId}/documents/${docId}/chunks`), {
        text: chunk,
        embedding: vectorValues,
        createdAt: serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, chunksIndexed: chunks.length });
  } catch (error) {
    console.error("Embedding & PDF Parse Error:", error);
    return NextResponse.json({ error: "Failed to process document embeddings." }, { status: 500 });
  }
}