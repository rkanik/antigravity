"use client";

import { Note, COLORS } from "./types";
import { useState, useEffect } from "react";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Palette, X, Clock } from "lucide-react";

interface EditNoteModalProps {
    note: Note;
    onClose: () => void;
}

export default function EditNoteModal({ note, onClose }: EditNoteModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [selectedColor, setSelectedColor] = useState(note.color || COLORS[0]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [lastEdited, setLastEdited] = useState<string>("");

    useEffect(() => {
        if (note.createdAt) {
            setLastEdited(note.createdAt.toDate().toLocaleString());
        }
    }, [note]);

    const handleSave = async () => {
        if (!user) return;

        // Only update if changes were made
        if (title === note.title && content === note.content && selectedColor === note.color) {
            onClose();
            return;
        }

        try {
            await updateDoc(doc(db, "users", user.uid, "notes", note.id), {
                title,
                content,
                color: selectedColor,
                updatedAt: serverTimestamp()
            });
            onClose();
        } catch (err) {
            console.error("Error updating note:", err);
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            await deleteDoc(doc(db, "users", user.uid, "notes", note.id));
            onClose();
        } catch (err) {
            console.error("Error deleting note:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleSave}>
            <div
                className={`w-full max-w-[600px] rounded-2xl shadow-2xl border transition-colors duration-200 ${selectedColor} border-neutral-700`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col p-4">
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-xl font-medium text-white placeholder-neutral-400 focus:outline-none mb-4"
                    />
                    <textarea
                        placeholder="Note"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-transparent text-neutral-200 placeholder-neutral-400 focus:outline-none resize-none min-h-[200px] text-base leading-relaxed"
                    />

                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="p-2 hover:bg-neutral-800/50 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors"
                                    title="Background options"
                                >
                                    <Palette className="w-4 h-4" />
                                </button>

                                {showColorPicker && (
                                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-neutral-800 rounded-xl shadow-xl border border-neutral-700 flex gap-1 z-50">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-6 h-6 rounded-full border ${color} ${selectedColor === color ? 'ring-2 ring-white' : ''} hover:scale-110 transition-transform`}
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
                            <span className="text-xs text-neutral-500 ml-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Edited {lastEdited}
                            </span>
                        </div>

                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800/50 rounded-md transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
