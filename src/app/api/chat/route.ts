import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { message, userId, model } = await req.json();

        if (!message || !userId) {
            return NextResponse.json(
                { error: "Missing message or userId" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        // Initialize GoogleGenAI
        const ai = new GoogleGenAI({ apiKey });

        // Call Gemini API using the SDK
        const response = await ai.models.generateContent({
            model: model || "gemini-1.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [{ text: message }],
                },
            ],
        });

        const aiResponse = response.response.text() || "I'm sorry, I couldn't generate a response.";

        // Save AI response to Firestore (using firebase-admin for server-side)
        const db = getAdminDb();
        await db
            .collection("chats")
            .doc(userId)
            .collection("messages")
            .add({
                role: "model",
                content: aiResponse,
                createdAt: FieldValue.serverTimestamp(),
            });

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
