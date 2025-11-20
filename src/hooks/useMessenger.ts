import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    onSnapshot,
    doc,
    updateDoc,
    arrayUnion,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUser: UserProfile;
    toUserId: string;
    status: "pending" | "accepted" | "rejected";
    createdAt: any;
}

export interface Conversation {
    id: string;
    participants: string[];
    participantDetails: UserProfile[]; // Populated client-side or via separate fetch
    type: "direct" | "group";
    groupName?: string;
    lastMessage?: {
        content: string;
        senderId: string;
        createdAt: any;
    };
    updatedAt: any;
}

export interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: any;
    readBy: string[];
}

export function useMessenger() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    // Search users
    const searchUsers = async (searchTerm: string) => {
        if (!searchTerm.trim()) return [];
        setLoading(true);
        try {
            // Use server-side API with Firebase Admin for better search
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}&uid=${user?.uid}`);
            if (!response.ok) throw new Error("Search failed");

            const data = await response.json();
            return data.users as UserProfile[];
        } catch (error) {
            console.error("Error searching users:", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Send Friend Request
    const sendRequest = async (toUserId: string) => {
        if (!user) return;
        try {
            // Check if request already exists
            const q = query(
                collection(db, "friend_requests"),
                where("fromUserId", "==", user.uid),
                where("toUserId", "==", toUserId),
                where("status", "==", "pending")
            );
            const existing = await getDocs(q);
            if (!existing.empty) return; // Already sent

            await addDoc(collection(db, "friend_requests"), {
                fromUserId: user.uid,
                fromUser: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                },
                toUserId,
                status: "pending",
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending request:", error);
        }
    };

    // Accept Friend Request
    const acceptRequest = async (requestId: string, fromUserId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "friend_requests", requestId), {
                status: "accepted"
            });

            // Create a conversation
            // Check if conversation already exists
            // For simplicity in this MVP, we might just create a new one or check existing
            // A better approach is to have a consistent ID for direct chats like `min(uid1, uid2)_max(uid1, uid2)`
            const chatId = [user.uid, fromUserId].sort().join("_");
            const chatDocRef = doc(db, "conversations", chatId);

            // We use setDoc with merge to create if not exists
            await updateDoc(chatDocRef, {
                participants: arrayUnion(user.uid, fromUserId),
                type: "direct",
                updatedAt: serverTimestamp()
            }).catch(async () => {
                // If update fails, it might not exist, so set it
                await import("firebase/firestore").then(({ setDoc }) =>
                    setDoc(chatDocRef, {
                        participants: [user.uid, fromUserId],
                        type: "direct",
                        updatedAt: serverTimestamp(),
                        participantDetails: [] // We'll fetch these
                    })
                );
            });

        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    // Create Group
    const createGroup = async (name: string, participantIds: string[]) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "conversations"), {
                participants: [user.uid, ...participantIds],
                type: "group",
                groupName: name,
                updatedAt: serverTimestamp(),
                createdBy: user.uid
            });
        } catch (error) {
            console.error("Error creating group:", error);
        }
    };

    // Send Message
    const sendMessage = async (conversationId: string, content: string) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "conversations", conversationId, "messages"), {
                senderId: user.uid,
                content,
                createdAt: serverTimestamp(),
                readBy: [user.uid]
            });

            // Update conversation last message
            await updateDoc(doc(db, "conversations", conversationId), {
                lastMessage: {
                    content,
                    senderId: user.uid,
                    createdAt: serverTimestamp()
                },
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Listen to Requests
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "friend_requests"),
            where("toUserId", "==", user.uid),
            where("status", "==", "pending")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
            setRequests(reqs);
        });
        return () => unsubscribe();
    }, [user]);

    // Listen to Conversations
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "conversations"),
            where("participants", "array-contains", user.uid),
            orderBy("updatedAt", "desc")
        );
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const convs = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                // Fetch participant details if needed, or store them in the doc
                // For now, we'll just return the data and handle details fetching in the component or here
                // Optimization: Store participant snapshots in the conversation doc or fetch once

                // Fetching participant details for display
                const participantDetails: UserProfile[] = [];
                if (data.participants) {
                    // This is N+1 query, but for MVP it's okay. 
                    // Better: Store minimal user info in participants array or separate map
                    // Or use a separate hook to resolve user IDs to profiles
                    for (const uid of data.participants) {
                        if (uid === user.uid) continue;
                        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));
                        if (!userDoc.empty) {
                            participantDetails.push(userDoc.docs[0].data() as UserProfile);
                        }
                    }
                }

                return {
                    id: docSnapshot.id,
                    ...data,
                    participantDetails
                } as Conversation;
            }));
            setConversations(convs);
        });
        return () => unsubscribe();
    }, [user]);

    return {
        user,
        requests,
        conversations,
        loading,
        searchUsers,
        sendRequest,
        acceptRequest,
        createGroup,
        sendMessage
    };
}
