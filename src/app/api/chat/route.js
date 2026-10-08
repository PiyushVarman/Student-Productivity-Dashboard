import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Updated to the current model recommended by the API error message
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    let formattedHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    while (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
      formattedHistory.shift();
    }

    const latestMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(latestMessage);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response from Gemini." },
      { status: 500 }
    );
  }
}