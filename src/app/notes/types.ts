import { Timestamp } from "firebase/firestore";

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: Timestamp;
    color: string;
}

export const COLORS = [
    "bg-neutral-900 border-neutral-800", // Default/Empty
    "bg-red-900/50 border-red-800",
    "bg-orange-900/50 border-orange-800",
    "bg-yellow-900/50 border-yellow-800",
    "bg-green-900/50 border-green-800",
    "bg-teal-900/50 border-teal-800",
    "bg-blue-900/50 border-blue-800",
    "bg-indigo-900/50 border-indigo-800",
    "bg-purple-900/50 border-purple-800",
    "bg-pink-900/50 border-pink-800",
];
