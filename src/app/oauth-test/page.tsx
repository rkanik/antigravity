"use client";

import { useState, useEffect, Suspense } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

function OAuthTestContent() {
    const [name, setName] = useState("contacts");
    const [scope, setScope] = useState("https://www.googleapis.com/auth/contacts.readonly");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const success = searchParams.get("success");
        const errorParam = searchParams.get("error");
        const path = searchParams.get("path");

        if (success && path) {
            setResult({
                message: "Auth successful and saved to Firestore via Server-Side Flow",
                path: path
            });
            // Clean URL
            router.replace("/oauth-test");
        } else if (errorParam) {
            setError(decodeURIComponent(errorParam));
            router.replace("/oauth-test");
        }
    }, [searchParams, router]);

    const handleAuth = async () => {
        if (!auth.currentUser) {
            setError("Please login first (use the main login page if needed)");
            return;
        }

        setLoading(true);
        setError("");

        // Redirect to server-side auth flow
        const uid = auth.currentUser.uid;
        window.location.href = `/api/auth/redirect?scope=${encodeURIComponent(scope)}&name=${encodeURIComponent(name)}&uid=${uid}`;
    };

    const handleFetch = async () => {
        if (!auth.currentUser) {
            setError("Please login first");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const docRef = doc(db, "users", auth.currentUser.uid, "tokens", name);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Convert timestamp to date for display
                if (data.expiryDate && data.expiryDate.toDate) {
                    data.expiryDate = data.expiryDate.toDate().toString();
                }
                if (data.updatedAt && data.updatedAt.toDate) {
                    data.updatedAt = data.updatedAt.toDate().toString();
                }
                setResult({
                    message: "Fetched from Firestore",
                    data: data
                });
            } else {
                setError("No token found for this name");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Fetch failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!auth.currentUser) {
            setError("Please login first");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            // First get the refresh token
            const docRef = doc(db, "users", auth.currentUser.uid, "tokens", name);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                setError("No token found to refresh");
                setLoading(false);
                return;
            }

            const currentData = docSnap.data();
            const refreshToken = currentData.refreshToken;

            if (!refreshToken) {
                setError("No refresh token available");
                setLoading(false);
                return;
            }

            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Refresh failed");
            }

            setResult({
                message: "Refresh successful",
                data: data
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Refresh failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">OAuth Debugger (Server-Side)</h1>

            <div className="space-y-4 bg-neutral-900 p-6 rounded-xl border border-white/10">
                <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-400">Token Name (Firestore ID)</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-neutral-800 border border-white/10 rounded-lg p-3 text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-400">Scope</label>
                    <input
                        type="text"
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        className="w-full bg-neutral-800 border border-white/10 rounded-lg p-3 text-white"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={handleAuth}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Auth & Save (Server)"}
                    </button>
                    <button
                        onClick={handleFetch}
                        disabled={loading}
                        className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Fetch Saved
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Refresh Token
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {result && (
                <div className="bg-neutral-900 p-6 rounded-xl border border-white/10 overflow-hidden">
                    <h3 className="text-lg font-medium mb-4 text-green-400">Result</h3>
                    <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm font-mono text-neutral-300">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default function OAuthTestPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <Suspense fallback={<Loader2 className="animate-spin mx-auto mt-20" />}>
                <OAuthTestContent />
            </Suspense>
        </div>
    );
}
