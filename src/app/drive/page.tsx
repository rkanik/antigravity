"use client";

import { Search, Loader2, HardDrive, ExternalLink, File, Folder, Image, Film, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    size: string;
    createdTime: string;
    webViewLink: string;
    iconLink: string;
    thumbnailLink?: string;
}

export default function DrivePage() {
    const { user, loading: authLoading, grantDrivePermission } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentFolderId, setCurrentFolderId] = useState("root");
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([{ id: "root", name: "My Drive" }]);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [permissionRequired, setPermissionRequired] = useState(false);

    const fetchFiles = async () => {
        if (!user) return { files: [] };

        // 1. Get tokens from Firestore
        const tokenDocRef = doc(db, "users", user.uid, "tokens", "drive");
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

        // 3. Fetch files
        let url = "/api/drive";
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);
        if (!searchQuery) params.append("folderId", currentFolderId);

        if (params.toString()) url += `?${params.toString()}`;

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
            throw new Error("Failed to fetch files");
        }

        return response.json();
    };

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["drive-files", currentFolderId, searchQuery, user?.uid],
        queryFn: fetchFiles,
        enabled: !!user && !authLoading,
        retry: false,
    });

    const files: DriveFile[] = data?.files || [];

    const handleGrantPermission = async () => {
        const success = await grantDrivePermission();
        if (success) {
            setPermissionRequired(false);
            refetch();
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Query will automatically refetch due to dependency on searchQuery
    };

    const handleFolderClick = (folderId: string, folderName: string) => {
        setCurrentFolderId(folderId);
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
        setSearchQuery(""); // Clear search when navigating
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
        setSearchQuery("");
    };

    const getIcon = (mimeType: string) => {
        if (mimeType.includes("folder")) return <Folder className="w-6 h-6 text-blue-400" />;
        if (mimeType.includes("image")) return <Image className="w-6 h-6 text-purple-400" />;
        if (mimeType.includes("video")) return <Film className="w-6 h-6 text-red-400" />;
        return <File className="w-6 h-6 text-gray-400" />;
    };

    const folders = files.filter(f => f.mimeType === "application/vnd.google-apps.folder");
    const regularFiles = files.filter(f => f.mimeType !== "application/vnd.google-apps.folder");

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                        Drive
                    </h1>
                </div>
                <div className="flex items-center gap-4 mb-6">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search Drive..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                        />
                    </form>
                    <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"}`}
                            title="List View"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-6 text-sm text-neutral-400 overflow-x-auto pb-2">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id} className="flex items-center gap-2 whitespace-nowrap">
                            {index > 0 && <span>/</span>}
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={`hover:text-white transition-colors ${index === breadcrumbs.length - 1 ? "text-white font-medium" : ""}`}
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    </div>
                ) : permissionRequired || (error && (error as Error).message === "Permission required") ? (
                    <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                        <p className="text-neutral-400">Access to Drive is required to view files.</p>
                        <button
                            onClick={handleGrantPermission}
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-full transition-colors shadow-lg shadow-green-500/20 font-medium flex items-center gap-2"
                        >
                            <HardDrive className="w-5 h-5" />
                            Connect Drive
                        </button>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                        <p className="text-red-400">Failed to load files. Please try again.</p>
                    </div>
                ) : folders.length === 0 && regularFiles.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-neutral-500">
                        No files found.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Folders */}
                        {folders.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold mb-4 text-neutral-300">Folders</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {folders.map((folder) => (
                                        <div
                                            key={folder.id}
                                            onDoubleClick={() => handleFolderClick(folder.id, folder.name)}
                                            className="p-4 bg-neutral-900/50 border border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group select-none"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <Folder className="w-8 h-8 text-blue-400 fill-blue-400/20" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-white truncate" title={folder.name}>{folder.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Files */}
                        {regularFiles.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold mb-4 text-neutral-300">Files</h2>
                                {viewMode === "list" ? (
                                    <div className="bg-neutral-900/50 border border-white/10 rounded-3xl overflow-hidden">
                                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm text-neutral-500 font-medium">
                                            <div className="col-span-6">Name</div>
                                            <div className="col-span-3">Size</div>
                                            <div className="col-span-3">Last Modified</div>
                                        </div>

                                        {regularFiles.map((file, index) => (
                                            <a
                                                key={file.id}
                                                href={file.webViewLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer group ${index !== regularFiles.length - 1 ? "border-b border-white/5" : ""
                                                    }`}
                                            >
                                                <div className="col-span-6 flex items-center gap-4 overflow-hidden">
                                                    {getIcon(file.mimeType)}
                                                    <span className="font-medium text-white truncate">{file.name}</span>
                                                </div>
                                                <div className="col-span-3 text-neutral-400 text-sm">{file.size}</div>
                                                <div className="col-span-3 flex items-center justify-between text-neutral-400 text-sm">
                                                    {new Date(file.createdTime).toLocaleDateString()}
                                                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {regularFiles.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.webViewLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative aspect-square bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden hover:bg-white/5 transition-colors"
                                            >
                                                {file.thumbnailLink ? (
                                                    <img
                                                        src={file.thumbnailLink}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {getIcon(file.mimeType)}
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-8">
                                                    <p className="text-white text-sm font-medium truncate">{file.name}</p>
                                                    <p className="text-neutral-400 text-xs mt-1">{file.size}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
