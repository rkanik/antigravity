import { useState } from "react";
import { Search, UserPlus, Loader2, Check } from "lucide-react";
import { useMessenger, UserProfile } from "@/hooks/useMessenger";

export default function UserSearch() {
    const { searchUsers, sendRequest } = useMessenger();
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        const users = await searchUsers(searchTerm);
        setResults(users);
        setLoading(false);
    };

    const handleSendRequest = async (uid: string) => {
        await sendRequest(uid);
        setSentRequests(prev => new Set(prev).add(uid));
    };

    return (
        <div className="p-4">
            <form onSubmit={handleSearch} className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </form>

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="space-y-3">
                    {results.map(user => (
                        <div key={user.uid} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <img
                                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`}
                                    alt={user.displayName}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <p className="font-medium text-sm">{user.displayName}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSendRequest(user.uid)}
                                disabled={sentRequests.has(user.uid)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full disabled:opacity-50"
                            >
                                {sentRequests.has(user.uid) ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <UserPlus className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    ))}
                    {results.length === 0 && searchTerm && !loading && (
                        <p className="text-center text-gray-500 text-sm">No users found</p>
                    )}
                </div>
            )}
        </div>
    );
}
