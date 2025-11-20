import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { refreshToken, } = await request.json();


        console.log("GOOGLE_SERVICE_ACCOUNT", process.env.GOOGLE_SERVICE_ACCOUNT)

        if (!refreshToken) {
            return NextResponse.json({ error: "Refresh token is required" }, { status: 400 });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const auth = new google.auth.OAuth2(clientId, clientSecret);
        auth.setCredentials({ refresh_token: refreshToken });

        const { credentials } = await auth.refreshAccessToken();

        return NextResponse.json({
            accessToken: credentials.access_token,
            expiryDate: credentials.expiry_date,
            refreshToken: credentials.refresh_token || refreshToken // Sometimes it returns a new refresh token
        });
    } catch (error: any) {
        console.error("Error refreshing token:", error);
        return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
    }
}
