import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });

        const service = google.youtube({ version: "v3", auth });

        let response;
        if (query) {
            // Search for videos
            response = await service.search.list({
                part: ["snippet"],
                q: query,
                type: ["video"],
                maxResults: 24,
            });
        } else {
            // Get trending videos
            response = await service.videos.list({
                part: ["snippet", "statistics"],
                chart: "mostPopular",
                regionCode: "BD",
                maxResults: 24,
            });
        }

        const videos = response.data.items || [];

        const formattedVideos = videos.map((video) => {
            const snippet = video.snippet;
            const id = typeof video.id === 'string' ? video.id : video.id?.videoId;

            return {
                id: id,
                title: snippet?.title,
                description: snippet?.description,
                thumbnail: snippet?.thumbnails?.medium?.url,
                channelTitle: snippet?.channelTitle,
                publishedAt: snippet?.publishedAt,
            };
        });

        return NextResponse.json({ videos: formattedVideos });
    } catch (error: any) {
        console.error("Error fetching youtube videos:", error);
        return NextResponse.json({ error: "Failed to fetch videos" }, { status: error.code || 500 });
    }
}
