import { Check, X } from "lucide-react";
import { useMessenger } from "@/hooks/useMessenger";

export default function RequestList() {
    const { requests, acceptRequest } = useMessenger();

    if (requests.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>No pending requests</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Friend Requests</h3>
            {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <img
                            src={req.fromUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.fromUser.displayName)}`}
                            alt={req.fromUser.displayName}
                            className="w-10 h-10 rounded-full"
                        />
                        <div>
                            <p className="font-medium text-sm">{req.fromUser.displayName}</p>
                            <p className="text-xs text-gray-500">wants to connect</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => acceptRequest(req.id, req.fromUserId)}
                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        {/* Reject not implemented in hook yet, but UI can exist */}
                        <button
                            className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
