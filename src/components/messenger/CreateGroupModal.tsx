import { useState } from "react";
import { X, Users, Check } from "lucide-react";
import { useMessenger, UserProfile } from "@/hooks/useMessenger";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
    const { searchUsers, createGroup } = useMessenger();
    const [groupName, setGroupName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length > 2) {
            setLoading(true);
            const users = await searchUsers(term);
            setSearchResults(users);
            setLoading(false);
        } else {
            setSearchResults([]);
        }
    };

    const toggleUser = (user: UserProfile) => {
        if (selectedUsers.find(u => u.uid === user.uid)) {
            setSelectedUsers(selectedUsers.filter(u => u.uid !== user.uid));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        await createGroup(groupName, selectedUsers.map(u => u.uid));
        onClose();
        setGroupName("");
        setSelectedUsers([]);
        setSearchTerm("");
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Create Group</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Participants</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search users..."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none mb-2"
                        />

                        {/* Selected Users Chips */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedUsers.map(user => (
                                <div key={user.uid} className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                                    <span>{user.displayName}</span>
                                    <button onClick={() => toggleUser(user)} className="hover:text-emerald-900"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>

                        {/* Search Results */}
                        <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-700 rounded-lg p-1">
                            {loading ? (
                                <div className="p-2 text-center text-sm text-gray-500">Searching...</div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(user => (
                                    <button
                                        key={user.uid}
                                        onClick={() => toggleUser(user)}
                                        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`}
                                                className="w-8 h-8 rounded-full"
                                                alt=""
                                            />
                                            <span className="text-sm">{user.displayName}</span>
                                        </div>
                                        {selectedUsers.find(u => u.uid === user.uid) && (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        )}
                                    </button>
                                ))
                            ) : searchTerm.length > 2 ? (
                                <div className="p-2 text-center text-sm text-gray-500">No users found</div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
}
