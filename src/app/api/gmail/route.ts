import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: "v1", auth });

        const response = await gmail.users.messages.list({
            userId: "me",
            maxResults: 20,
            q: "in:inbox",
        });

        const messages = response.data.messages || [];

        const detailedMessages = await Promise.all(
            messages.map(async (message) => {
                const detail = await gmail.users.messages.get({
                    userId: "me",
                    id: message.id!,
                    format: "full",
                });
                return detail.data;
            })
        );

        return NextResponse.json({ messages: detailedMessages });
    } catch (error) {
        console.error("Error fetching emails:", error);
        return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
    }
}
