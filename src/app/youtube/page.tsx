"use client";

import { Search, Loader2, Play, Youtube, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";

interface Video {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    description: string;
}

export default function YouTubePage() {
    const { user, loading: authLoading, grantYouTubePermission } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [permissionRequired, setPermissionRequired] = useState(false);

    const fetchVideos = async () => {
        if (!user) return { videos: [] };

        // 1. Get tokens from Firestore
        const tokenDocRef = doc(db, "users", user.uid, "tokens", "youtube");
        const tokenDoc = await getDoc(tokenDocRef);

        if (!tokenDoc.exists()) {
            setPermissionRequired(true);
            throw new Error("Permission required");
        }

        const tokenData = tokenDoc.data();
        let accessToken = tokenData.accessToken;
        const refreshToken = tokenData.refreshToken;
        const expiryDate = tokenData.expiryDate?.toDate();

        // 2. Check if token is expired
        const now = new Date();
        if (expiryDate && now >= expiryDate) {
            if (!refreshToken) {
                setPermissionRequired(true);
                throw new Error("Permission required");
            }

            const refreshResponse = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (!refreshResponse.ok) {
                setPermissionRequired(true);
                throw new Error("Permission required");
            }

            const refreshData = await refreshResponse.json();
            accessToken = refreshData.accessToken;

            const newExpiryDate = new Date();
            if (refreshData.expiryDate) {
                newExpiryDate.setTime(refreshData.expiryDate);
            } else {
                newExpiryDate.setSeconds(newExpiryDate.getSeconds() + 3600);
            }

            await setDoc(tokenDocRef, {
                accessToken: accessToken,
                expiryDate: newExpiryDate,
                refreshToken: refreshData.refreshToken || refreshToken,
                updatedAt: new Date()
            }, { merge: true });
        }

        // 3. Fetch videos
        let url = "/api/youtube";
        if (searchQuery) {
            url += `?q=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 401 || response.status === 403) {
            setPermissionRequired(true);
            throw new Error("Permission required");
        }

        if (!response.ok) {
            throw new Error("Failed to fetch videos");
        }

        return response.json();
    };

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["youtube-videos", searchQuery, user?.uid],
        queryFn: fetchVideos,
        enabled: !!user && !authLoading,
        retry: false,
    });

    const videos: Video[] = data?.videos || [];

    const handleGrantPermission = async () => {
        const success = await grantYouTubePermission();
        if (success) {
            setPermissionRequired(false);
            refetch();
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Query will automatically refetch due to dependency on searchQuery
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-600">
                        YouTube
                    </h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="relative mb-8">
                    <form onSubmit={handleSearch}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                        />
                    </form>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    </div>
                ) : permissionRequired || (error && (error as Error).message === "Permission required") ? (
                    <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                        <p className="text-neutral-400">Access to YouTube is required.</p>
                        <button
                            onClick={handleGrantPermission}
                            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full transition-colors shadow-lg shadow-red-500/20 font-medium flex items-center gap-2"
                        >
                            <Youtube className="w-5 h-5" />
                            Connect YouTube
                        </button>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                        <p className="text-red-400">Failed to load videos. Please try again.</p>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-neutral-500">
                        No videos found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                onClick={() => setSelectedVideo(video)}
                                className="group cursor-pointer bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/5 transition-all"
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                            <Play className="w-5 h-5 text-white fill-white ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-red-400 transition-colors">
                                        {video.title}
                                    </h3>
                                    <p className="text-sm text-neutral-400 mb-2">{video.channelTitle}</p>
                                    <p className="text-xs text-neutral-500">
                                        {new Date(video.publishedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-5xl bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-900">
                            <h3 className="font-semibold text-white truncate pr-4">{selectedVideo.title}</h3>
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-neutral-400" />
                            </button>
                        </div>
                        <div className="aspect-video bg-black">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="p-6 bg-neutral-900">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white">{selectedVideo.channelTitle}</h2>
                                <span className="text-sm text-neutral-400">
                                    {new Date(selectedVideo.publishedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-neutral-300 whitespace-pre-wrap line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                                {selectedVideo.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
