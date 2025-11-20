import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const name = searchParams.get("name");
    const uid = searchParams.get("uid");
    const next = searchParams.get("next");

    if (!scope || !name || !uid) {
        return NextResponse.json({ error: "Missing scope, name, or uid" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/handler`;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const url = auth.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: scope.split(" "), // Support multiple scopes separated by space
        state: JSON.stringify({ uid, name, next }) // Pass uid, name, and next in state
    });

    return NextResponse.redirect(url);
}
