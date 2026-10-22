import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collectionGroup, query, getDocs } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1].content;

    // 1. Generate an embedding for the user's question using Gemini
    let retrievedContext = "";
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const embeddingResult = await embeddingModel.embedContent(latestMessage);
      const queryVector = embeddingResult.embedding.values;

      // 2. Query Firestore vector chunks using modular syntax
      const chunksRef = collectionGroup(db, "chunks");
      const vectorQuery = query(chunksRef, {
        vectorField: "embedding",
        queryVector: queryVector,
        limit: 3,
        distanceMeasure: "COSINE",
      });

      const snapshot = await getDocs(vectorQuery);
      snapshot.forEach((doc) => {
        retrievedContext += doc.data().text + "\n\n";
      });
    } catch (searchErr) {
      console.warn("Vector search skipped or failed (falling back to standard chat):", searchErr);
    }

    // 3. Set up the chat model with gemini-3.5-flash-lite
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    let formattedHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    while (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
      formattedHistory.shift();
    }

    const augmentedMessage = retrievedContext
      ? `You are Study Buddy, an AI assistant. Answer the student's question accurately using ONLY the provided document context below. If the answer cannot be found in the context, use your general knowledge but note that it wasn't found in their uploaded files.\n\n[Document Context]:\n${retrievedContext}\n\n[Student Question]: ${latestMessage}`
      : latestMessage;

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(augmentedMessage);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Gemini RAG API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response from Gemini." },
      { status: 500 }
    );
  }
}