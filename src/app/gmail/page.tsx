"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Mail, Search, PenSquare, RefreshCw, Trash2, ArrowLeft, Send, X } from "lucide-react";

interface EmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    payload: {
        headers: { name: string; value: string }[];
        body: { data: string };
        parts?: { body: { data: string }; mimeType: string }[];
    };
    internalDate: string;
}

export default function GmailPage() {
    const { user, loading: authLoading, grantGmailPermission } = useAuth();
    const [permissionRequired, setPermissionRequired] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [composeTo, setComposeTo] = useState("");
    const [composeSubject, setComposeSubject] = useState("");
    const [composeBody, setComposeBody] = useState("");
    const queryClient = useQueryClient();

    const fetchEmails = async () => {
        if (!user) return { messages: [] };

        // 1. Get tokens from Firestore
        const tokenDocRef = doc(db, "users", user.uid, "tokens", "gmail");
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

        // 3. Fetch emails
        const response = await fetch("/api/gmail", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 401 || response.status === 403) {
            setPermissionRequired(true);
            throw new Error("Permission required");
        }

        if (!response.ok) {
            throw new Error("Failed to fetch emails");
        }

        return response.json();
    };

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["gmail", user?.uid],
        queryFn: fetchEmails,
        enabled: !!user && !authLoading,
        retry: false,
    });

    const sendEmailMutation = useMutation({
        mutationFn: async (emailData: { to: string; subject: string; body: string }) => {
            const tokenDocRef = doc(db, "users", user!.uid, "tokens", "gmail");
            const tokenDoc = await getDoc(tokenDocRef);
            const accessToken = tokenDoc.data()?.accessToken;

            const response = await fetch("/api/gmail/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(emailData),
            });

            if (!response.ok) {
                throw new Error("Failed to send email");
            }

            return response.json();
        },
        onSuccess: () => {
            setIsComposing(false);
            setComposeTo("");
            setComposeSubject("");
            setComposeBody("");
            queryClient.invalidateQueries({ queryKey: ["gmail"] });
            alert("Email sent successfully!");
        },
        onError: (error) => {
            console.error("Error sending email:", error);
            alert("Failed to send email.");
        },
    });

    const handleGrantPermission = async () => {
        const success = await grantGmailPermission();
        if (success) {
            setPermissionRequired(false);
            refetch();
        }
    };

    const getHeader = (headers: { name: string; value: string }[], name: string) => {
        return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
    };

    const getBody = (payload: any) => {
        let bodyData = "";
        if (payload.parts) {
            const htmlPart = payload.parts.find((part: any) => part.mimeType === "text/html");
            const textPart = payload.parts.find((part: any) => part.mimeType === "text/plain");
            bodyData = htmlPart?.body?.data || textPart?.body?.data || "";
        } else {
            bodyData = payload.body?.data || "";
        }

        if (!bodyData) return "";

        // Replace URL-safe base64 characters
        const base64 = bodyData.replace(/-/g, '+').replace(/_/g, '/');
        try {
            return decodeURIComponent(escape(atob(base64)));
        } catch (e) {
            return atob(base64);
        }
    };

    const filteredEmails = data?.messages?.filter((email: EmailMessage) => {
        const subject = getHeader(email.payload.headers, "subject").toLowerCase();
        const from = getHeader(email.payload.headers, "from").toLowerCase();
        const query = searchQuery.toLowerCase();
        return subject.includes(query) || from.includes(query);
    }) || [];

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-600 flex items-center gap-3">
                        <Mail className="w-8 h-8 text-red-500" />
                        Gmail
                    </h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => refetch()}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => setIsComposing(true)}
                            className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20"
                        >
                            <PenSquare className="w-5 h-5" />
                            <span className="hidden sm:inline">Compose</span>
                        </button>
                    </div>
                </div>

                {permissionRequired || (error && (error as Error).message === "Permission required") ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-6">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                            <Mail className="w-10 h-10 text-red-500" />
                        </div>
                        <div className="text-center max-w-md">
                            <h2 className="text-xl font-semibold mb-2">Connect Gmail</h2>
                            <p className="text-neutral-400 mb-6">Access your emails directly from Antigravity. We need your permission to read and send emails.</p>
                            <button
                                onClick={handleGrantPermission}
                                className="bg-white text-neutral-900 hover:bg-neutral-200 px-8 py-3 rounded-full transition-colors font-medium flex items-center gap-2 mx-auto"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                        {/* Email List */}
                        <div className={`lg:col-span-1 bg-neutral-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-white/5">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="text"
                                        placeholder="Search mail..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-neutral-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-red-500/50"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                                    </div>
                                ) : filteredEmails.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-neutral-500 gap-2">
                                        <Mail className="w-8 h-8 opacity-20" />
                                        <p>No emails found</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {filteredEmails.map((email: EmailMessage) => {
                                            const isSelected = selectedEmail?.id === email.id;
                                            const from = getHeader(email.payload.headers, "from");
                                            const subject = getHeader(email.payload.headers, "subject");
                                            const date = new Date(parseInt(email.internalDate)).toLocaleDateString();

                                            return (
                                                <button
                                                    key={email.id}
                                                    onClick={() => setSelectedEmail(email)}
                                                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${isSelected ? "bg-white/5 border-l-2 border-l-red-500" : "border-l-2 border-transparent"}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`font-medium truncate pr-2 ${isSelected ? "text-white" : "text-neutral-300"}`}>
                                                            {from.split('<')[0].replace(/"/g, '')}
                                                        </span>
                                                        <span className="text-xs text-neutral-500 whitespace-nowrap">{date}</span>
                                                    </div>
                                                    <div className={`text-sm mb-1 truncate ${isSelected ? "text-neutral-200" : "text-neutral-400"}`}>
                                                        {subject || "(No Subject)"}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 truncate">
                                                        {email.snippet}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Email Detail View */}
                        <div className={`lg:col-span-2 bg-neutral-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col ${!selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
                            {selectedEmail ? (
                                <>
                                    <div className="p-6 border-b border-white/5 flex items-start gap-4">
                                        <button
                                            onClick={() => setSelectedEmail(null)}
                                            className="lg:hidden p-2 -ml-2 hover:bg-white/10 rounded-full text-neutral-400"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl font-semibold text-white mb-2 leading-snug">
                                                {getHeader(selectedEmail.payload.headers, "subject") || "(No Subject)"}
                                            </h2>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {getHeader(selectedEmail.payload.headers, "from").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white truncate">
                                                        {getHeader(selectedEmail.payload.headers, "from")}
                                                    </div>
                                                    <div className="text-sm text-neutral-400">
                                                        to {getHeader(selectedEmail.payload.headers, "to")}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-neutral-500">
                                                    {new Date(parseInt(selectedEmail.internalDate)).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                                        <div
                                            className="prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: getBody(selectedEmail.payload) }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 gap-4">
                                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
                                        <Mail className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p>Select an email to read</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Compose Modal */}
                {isComposing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h3 className="text-lg font-semibold text-white">New Message</h3>
                                <button
                                    onClick={() => setIsComposing(false)}
                                    className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                                <input
                                    type="email"
                                    placeholder="To"
                                    value={composeTo}
                                    onChange={(e) => setComposeTo(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/10 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Subject"
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/10 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
                                />
                                <textarea
                                    placeholder="Message"
                                    value={composeBody}
                                    onChange={(e) => setComposeBody(e.target.value)}
                                    className="w-full h-64 bg-transparent resize-none text-white placeholder-neutral-500 focus:outline-none"
                                />
                            </div>
                            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsComposing(false)}
                                    className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={() => sendEmailMutation.mutate({ to: composeTo, subject: composeSubject, body: composeBody })}
                                    disabled={sendEmailMutation.isPending}
                                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendEmailMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
