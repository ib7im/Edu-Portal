import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChatResponse(history: ChatMessage[], message: string, context?: string) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are a helpful academic assistant for EduPortal University. 
  You help students with course information, academic advice, and general school queries. 
  Be professional, encouraging, and clear.
  
  ${context ? `Here is the current student's context:
  ${context}` : ''}`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction,
    },
  });

  return response.text || "I'm sorry, I couldn't process that request.";
}
