import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(new URL(`/oauth-test?error=${error}`, request.url));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL(`/oauth-test?error=Missing code or state`, request.url));
    }

    try {
        const { uid, name, next } = JSON.parse(state);
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/handler`;

        const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const { tokens } = await auth.getToken(code);

        // Save to Firestore using Admin SDK
        const tokenData = {
            accessToken: tokens.access_token || null,
            refreshToken: tokens.refresh_token || null,
            expiryDate: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
            updatedAt: new Date(),
            scope: tokens.scope || null,
            tokenType: tokens.token_type || null,
            idToken: tokens.id_token || null
        };

        const adminDb = getAdminDb();
        await adminDb.collection("users").doc(uid).collection("tokens").doc(name).set(tokenData);

        if (next) {
            return NextResponse.redirect(new URL(next, request.url));
        }

        return NextResponse.redirect(new URL(`/oauth-test?success=true&path=users/${uid}/tokens/${name}`, request.url));

    } catch (err: any) {
        console.error("Error in OAuth callback:", err);
        return NextResponse.redirect(new URL(`/oauth-test?error=${encodeURIComponent(err.message)}`, request.url));
    }
}
