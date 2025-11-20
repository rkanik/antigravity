import { useState, useEffect, useRef } from "react";
import { Send, MoreVertical, Phone, Video, Info } from "lucide-react";
import { useMessenger, Conversation, Message } from "@/hooks/useMessenger";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface ChatWindowProps {
    conversation: Conversation;
    onBack?: () => void; // For mobile view
}

export default function ChatWindow({ conversation, onBack }: ChatWindowProps) {
    const { user } = useAuth();
    const { sendMessage } = useMessenger();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = query(
            collection(db, "conversations", conversation.id, "messages"),
            orderBy("createdAt", "asc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
            scrollToBottom();
        });
        return () => unsubscribe();
    }, [conversation.id]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        await sendMessage(conversation.id, input.trim());
        setInput("");
    };

    const getChatName = () => {
        if (conversation.type === "group") return conversation.groupName;
        const otherUser = conversation.participantDetails?.find(p => p.uid !== user?.uid);
        return otherUser?.displayName || "Unknown User";
    };

    const getChatImage = () => {
        if (conversation.type === "group") return `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.groupName || "Group")}&background=random`;
        const otherUser = conversation.participantDetails?.find(p => p.uid !== user?.uid);
        return otherUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.displayName || "U")}`;
    };

    return (
        <div className="flex flex-col h-full bg-[#efeae2] dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden text-gray-600 dark:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                    )}
                    <img src={getChatImage()} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{getChatName()}</h3>
                        {conversation.type === "group" && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                {conversation.participantDetails?.map(p => p.displayName).join(", ")}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-emerald-600 dark:text-emerald-500">
                    <button><Video className="w-5 h-5" /></button>
                    <button><Phone className="w-5 h-5" /></button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button><SearchIcon className="w-5 h-5" /></button>
                    <button><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat dark:bg-none dark:bg-gray-900">
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-lg p-2 px-3 shadow-sm relative ${isMe ? "bg-[#d9fdd3] dark:bg-emerald-900 text-gray-900 dark:text-gray-100 rounded-tr-none" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none"
                                }`}>
                                {conversation.type === "group" && !isMe && (
                                    <p className="text-xs font-bold text-orange-500 mb-1">
                                        {conversation.participantDetails?.find(p => p.uid === msg.senderId)?.displayName}
                                    </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 text-right mt-1">
                                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button type="button" className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                    </button>
                    <button type="button" className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message"
                        className="flex-1 py-2 px-4 rounded-lg border-none focus:ring-0 bg-white dark:bg-gray-700 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-2 text-emerald-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
}

function SearchIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}
