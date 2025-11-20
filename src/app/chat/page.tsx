"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User, Loader2, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Message {
    id: string;
    role: "user" | "model";
    content: string;
    createdAt: any;
}

interface Model {
    name: string;
    displayName: string;
    description: string;
}

export default function ChatPage() {
    const { user } = useAuth();
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("gemini-1.5-flash");
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

    // Fetch models
    const { data: modelsData } = useQuery({
        queryKey: ["models"],
        queryFn: async () => {
            const res = await fetch("/api/models");
            if (!res.ok) throw new Error("Failed to fetch models");
            return res.json();
        },
    });

    const models: Model[] = modelsData?.models || [];

    // Real-time subscription to messages
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "chats", user.uid, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Message[];
            setMessages(msgs);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const userMessage = input.trim();
        setInput("");
        setIsLoading(true);

        try {
            // 1. Save user message to Firestore
            await addDoc(collection(db, "chats", user.uid, "messages"), {
                role: "user",
                content: userMessage,
                createdAt: serverTimestamp(),
            });

            // 2. Call API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    userId: user.uid,
                    model: selectedModel
                }),
            });

            if (!response.ok) throw new Error("Failed to fetch response");

        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
            {/* Model Selector Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex justify-center relative z-10">
                <div className="relative">
                    <button
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                        <Bot className="w-4 h-4 text-purple-500" />
                        {models.find(m => m.name === selectedModel)?.displayName || selectedModel}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isModelDropdownOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                            {models.length > 0 ? (
                                models.map((model) => (
                                    <button
                                        key={model.name}
                                        onClick={() => {
                                            setSelectedModel(model.name);
                                            setIsModelDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col ${selectedModel === model.name ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" : "text-gray-700 dark:text-gray-200"
                                            }`}
                                    >
                                        <span className="font-medium">{model.displayName}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{model.description}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">Loading models...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Bot className="w-12 h-12 mb-2" />
                        <p>Start a conversation with the AI Agent!</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`flex items-start max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                                }`}
                        >
                            <div className="mr-2 mt-1">
                                {msg.role === "user" ? (
                                    <User className="w-4 h-4" />
                                ) : (
                                    <Bot className="w-4 h-4" />
                                )}
                            </div>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                            <Bot className="w-4 h-4 mr-2" />
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${models.find(m => m.name === selectedModel)?.displayName || "AI"}...`}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
