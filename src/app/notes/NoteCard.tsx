"use client";

import { Note } from "./types";
import { Trash2, Palette } from "lucide-react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { COLORS } from "./types";

interface NoteCardProps {
    note: Note;
    onClick: () => void;
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
    const { user } = useAuth();
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "notes", note.id));
        } catch (err) {
            console.error("Error deleting note:", err);
        }
    };

    const handleColorChange = async (color: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "notes", note.id), {
                color: color
            });
            setShowColorPicker(false);
        } catch (err) {
            console.error("Error updating note color:", err);
        }
    };

    return (
        <div
            onClick={onClick}
            className={`group relative rounded-xl border p-4 transition-all hover:shadow-md cursor-default mb-4 break-inside-avoid ${note.color || COLORS[0]} border-transparent hover:border-neutral-600`}
        >
            {note.title && (
                <h3 className="font-medium text-lg mb-2 text-white">{note.title}</h3>
            )}
            <p className="text-neutral-300 whitespace-pre-wrap text-sm mb-8 font-normal leading-relaxed">
                {note.content}
            </p>

            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(!showColorPicker);
                        }}
                        className="p-2 hover:bg-neutral-800/50 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors"
                        title="Change color"
                    >
                        <Palette className="w-4 h-4" />
                    </button>

                    {showColorPicker && (
                        <div
                            className="absolute bottom-full left-0 mb-2 p-2 bg-neutral-800 rounded-xl shadow-xl border border-neutral-700 flex gap-1 z-50 w-[150px] flex-wrap"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    className={`w-6 h-6 rounded-full border ${color} ${note.color === color ? 'ring-2 ring-white' : ''} hover:scale-110 transition-transform`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-neutral-800/50 rounded-full text-neutral-400 hover:text-red-400 transition-colors"
                    title="Delete note"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
