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

        const service = google.people({ version: "v1", auth });
        const response = await service.people.connections.list({
            resourceName: "people/me",
            personFields: "names,emailAddresses,phoneNumbers,photos",
            pageSize: 500,
            sortOrder: 'FIRST_NAME_ASCENDING'
        });

        const connections = response.data.connections || [];

        const contacts = connections.map((person) => {
            const name = person.names?.[0]?.displayName || "Unknown";
            const email = person.emailAddresses?.[0]?.value || "";
            const phone = person.phoneNumbers?.[0]?.value || "";
            const photo = person.photos?.[0]?.url || "";
            const id = person.resourceName || "";

            return {
                id,
                name,
                email,
                phone,
                photo,
            };
        });

        return NextResponse.json({ contacts });
    } catch (error: any) {
        console.error("Error fetching contacts:", error.code, error);
        return NextResponse.json({ error: "Failed to fetch contacts" }, { status: error.code });
    }
}
