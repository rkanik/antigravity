import { NextResponse } from "next/server";

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        // Using REST API to list models as it's straightforward
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch models");
        }

        const data = await response.json();

        // Filter for models that support generateContent
        const models = data.models?.filter((model: any) =>
            model.supportedGenerationMethods?.includes("generateContent")
        ).map((model: any) => ({
            name: model.name.replace("models/", ""), // Remove prefix for easier usage
            displayName: model.displayName,
            description: model.description
        })) || [];

        return NextResponse.json({ models });
    } catch (error) {
        console.error("Error fetching models:", error);
        return NextResponse.json(
            { error: "Failed to fetch models" },
            { status: 500 }
        );
    }
}
