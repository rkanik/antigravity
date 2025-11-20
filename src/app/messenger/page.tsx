"use client";

import { useState } from "react";
import MessengerSidebar from "@/components/messenger/MessengerSidebar";
import ChatWindow from "@/components/messenger/ChatWindow";
import { Conversation } from "@/hooks/useMessenger";
import { MessageCircle } from "lucide-react";

export default function MessengerPage() {
    const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar - Hidden on mobile if chat is selected */}
            <div className={`w-full md:w-[400px] flex-shrink-0 ${selectedChat ? "hidden md:flex" : "flex"}`}>
                <MessengerSidebar
                    selectedChatId={selectedChat?.id}
                    onSelectChat={setSelectedChat}
                />
            </div>

            {/* Chat Window - Hidden on mobile if no chat selected */}
            <div className={`flex-1 flex flex-col ${!selectedChat ? "hidden md:flex" : "flex"}`}>
                {selectedChat ? (
                    <ChatWindow
                        conversation={selectedChat}
                        onBack={() => setSelectedChat(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-gray-900 text-gray-500 border-l border-gray-200 dark:border-gray-700">
                        <div className="w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-16 h-16 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-light text-gray-700 dark:text-gray-200 mb-2">Messenger for Web</h2>
                        <p className="text-sm max-w-md text-center">
                            Send and receive messages without keeping your phone online.
                            <br />
                            Use Messenger on up to 4 linked devices and 1 phone.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
