"use client";

import { Search, Loader2, UserPlus, Mail, Phone, User, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    photo: string;
}

export default function ContactsPage() {
    const { user, loading: authLoading, grantContactsPermission } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [permissionRequired, setPermissionRequired] = useState(false);

    const fetchContacts = async () => {
        if (!user) return { contacts: [] };

        // 1. Get tokens from Firestore
        const tokenDocRef = doc(db, "users", user.uid, "tokens", "contacts");
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

        // 3. Fetch contacts
        const response = await fetch("/api/contacts", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 401 || response.status === 403) {
            setPermissionRequired(true);
            throw new Error("Permission required");
        }

        if (!response.ok) {
            throw new Error("Failed to fetch contacts");
        }

        return response.json();
    };

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["contacts", user?.uid],
        queryFn: fetchContacts,
        enabled: !!user && !authLoading,
        retry: false,
    });

    const contacts: Contact[] = data?.contacts || [];

    const handleGrantPermission = async () => {
        const success = await grantContactsPermission();
        if (success) {
            setPermissionRequired(false);
            refetch();
        }
    };

    const filteredContacts = contacts.filter((contact) => {
        const name = contact.name?.toLowerCase() || "";
        const email = contact.email?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
                        Contacts
                    </h1>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                        <UserPlus className="w-5 h-5" />
                        <span className="hidden sm:inline">Create Contact</span>
                    </button>
                </div>
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : permissionRequired || (error && (error as Error).message === "Permission required") ? (
                    <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                        <p className="text-neutral-400">Access to Google Contacts is required.</p>
                        <button
                            onClick={handleGrantPermission}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full transition-colors shadow-lg shadow-blue-500/20 font-medium"
                        >
                            Connect Google Contacts
                        </button>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                        <p className="text-red-400">Failed to load contacts. Please try again.</p>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-neutral-500">
                        No contacts found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                className="p-6 rounded-3xl border border-white/10 bg-neutral-900/50 hover:bg-white/5 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button className="p-2 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-full transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-500/20 overflow-hidden">
                                        {contact.photo ? (
                                            <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
                                        ) : (
                                            contact.name?.[0] || <User className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                            {contact.name || "No Name"}
                                        </h3>
                                        <div className="space-y-1">
                                            {contact.email && (
                                                <div className="flex items-center gap-2 text-sm text-neutral-400">
                                                    <Mail className="w-4 h-4" />
                                                    <span className="truncate">{contact.email}</span>
                                                </div>
                                            )}
                                            {contact.phone && (
                                                <div className="flex items-center gap-2 text-sm text-neutral-400">
                                                    <Phone className="w-4 h-4" />
                                                    <span className="truncate">{contact.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
