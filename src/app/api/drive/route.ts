import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const folderId = searchParams.get("folderId") || "root";

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });

        const service = google.drive({ version: "v3", auth });

        let q = "trashed = false";
        if (query) {
            q += ` and name contains '${query}'`;
        } else {
            q += ` and '${folderId}' in parents`;
        }

        const response = await service.files.list({
            q: q,
            pageSize: 100,
            fields: "nextPageToken, files(id, name, mimeType, size, createdTime, webViewLink, iconLink, thumbnailLink)",
            orderBy: "folder,name",
        });

        const files = response.data.files || [];

        const formattedFiles = files.map((file) => {
            return {
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size ? formatBytes(parseInt(file.size)) : "-",
                createdTime: file.createdTime,
                webViewLink: file.webViewLink,
                iconLink: file.iconLink,
                thumbnailLink: file.thumbnailLink,
            };
        });

        return NextResponse.json({ files: formattedFiles });
    } catch (error: any) {
        console.error("Error fetching drive files:", error);
        return NextResponse.json({ error: "Failed to fetch files" }, { status: error.code || 500 });
    }
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
