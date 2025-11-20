import { useState } from "react";
import { MessageCircle, Users, MoreVertical, Plus, Search } from "lucide-react";
import { useMessenger, Conversation } from "@/hooks/useMessenger";
import { useAuth } from "@/context/AuthContext";
import UserSearch from "./UserSearch";
import RequestList from "./RequestList";
import CreateGroupModal from "./CreateGroupModal";

interface MessengerSidebarProps {
    selectedChatId?: string;
    onSelectChat: (chat: Conversation) => void;
}

export default function MessengerSidebar({ selectedChatId, onSelectChat }: MessengerSidebarProps) {
    const { user } = useAuth();
    const { conversations } = useMessenger();
    const [activeTab, setActiveTab] = useState<"chats" | "requests" | "search">("chats");
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    const getChatName = (conv: Conversation) => {
        if (conv.type === "group") return conv.groupName;
        const otherUser = conv.participantDetails?.find(p => p.uid !== user?.uid);
        return otherUser?.displayName || "Unknown User";
    };

    const getChatImage = (conv: Conversation) => {
        if (conv.type === "group") return `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.groupName || "Group")}&background=random`;
        const otherUser = conv.participantDetails?.find(p => p.uid !== user?.uid);
        return otherUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.displayName || "U")}`;
    };

    const getLastMessage = (conv: Conversation) => {
        if (!conv.lastMessage) return "No messages yet";
        const isMe = conv.lastMessage.senderId === user?.uid;
        return (isMe ? "You: " : "") + conv.lastMessage.content;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-3 bg-gray-100 dark:bg-gray-800 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <img src={user?.photoURL || ""} alt="" className="w-10 h-10 rounded-full" />
                    <span className="font-semibold hidden md:block">{user?.displayName}</span>
                </div>
                <div className="flex gap-3 text-gray-600 dark:text-gray-300">
                    <button onClick={() => setActiveTab("search")} title="Search Users">
                        <Users className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsGroupModalOpen(true)} title="New Group">
                        <Plus className="w-5 h-5" />
                    </button>
                    <button>
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search Bar (Filter Chats) */}
            {activeTab === "chats" && (
                <div className="p-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="w-full py-1.5 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2" />
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab("chats")}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "chats" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                >
                    Chats
                </button>
                <button
                    onClick={() => setActiveTab("requests")}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "requests" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                >
                    Requests
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "chats" && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => onSelectChat(conv)}
                                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${selectedChatId === conv.id ? "bg-gray-100 dark:bg-gray-800" : ""
                                    }`}
                            >
                                <img src={getChatImage(conv)} alt="" className="w-12 h-12 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{getChatName(conv)}</h3>
                                        <span className="text-xs text-gray-500">
                                            {conv.lastMessage?.createdAt?.toDate().toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">{getLastMessage(conv)}</p>
                                </div>
                            </button>
                        ))}
                        {conversations.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <p>No conversations yet.</p>
                                <button onClick={() => setActiveTab("search")} className="text-emerald-600 hover:underline mt-2">Find friends</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "requests" && <RequestList />}

                {activeTab === "search" && (
                    <div>
                        <div className="p-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
                            <button onClick={() => setActiveTab("chats")} className="text-emerald-600 text-sm font-medium">Back</button>
                            <span className="text-sm font-semibold">Find People</span>
                        </div>
                        <UserSearch />
                    </div>
                )}
            </div>

            <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
        </div>
    );
}
