"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLORS } from "./types";
import { Palette, Image as ImageIcon, Undo, Redo, Bell } from "lucide-react";

export default function CreateNote() {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // If clicking outside, save if there's content, then collapse
                if (title.trim() || content.trim()) {
                    handleCreateNote();
                }
                setIsExpanded(false);
                setShowColorPicker(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [title, content, selectedColor]);

    const handleCreateNote = async () => {
        if (!user || (!title.trim() && !content.trim())) {
            resetForm();
            return;
        }

        try {
            await addDoc(collection(db, "users", user.uid, "notes"), {
                title,
                content,
                createdAt: serverTimestamp(),
                color: selectedColor,
            });
            resetForm();
        } catch (err) {
            console.error("Error creating note:", err);
        }
    };

    const resetForm = () => {
        setTitle("");
        setContent("");
        setSelectedColor(COLORS[0]);
        setIsExpanded(false);
        setShowColorPicker(false);
    };

    return (
        <div className="w-full max-w-[600px] mx-auto mb-8 relative z-20" ref={containerRef}>
            <div
                className={`rounded-2xl border shadow-lg transition-all duration-200 ${selectedColor} ${isExpanded ? 'border-neutral-700' : 'border-neutral-800'}`}
            >
                {/* Collapsed State */}
                {!isExpanded && (
                    <div
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center justify-between p-4 cursor-text"
                    >
                        <span className="text-neutral-400 font-medium">Take a note...</span>
                        <div className="flex gap-4 text-neutral-400">
                            <div className="p-2 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Expanded State */}
                {isExpanded && (
                    <div className="flex flex-col">
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent px-4 pt-4 pb-2 text-lg font-medium text-white placeholder-neutral-400 focus:outline-none"
                        />
                        <textarea
                            placeholder="Take a note..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent px-4 py-2 text-neutral-200 placeholder-neutral-400 focus:outline-none resize-none min-h-[100px]"
                        />

                        <div className="flex items-center justify-between p-2 mt-2">
                            <div className="flex items-center gap-1">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        className="p-2 hover:bg-neutral-800/50 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors"
                                        title="Background options"
                                    >
                                        <Palette className="w-4 h-4" />
                                    </button>

                                    {/* Color Picker Popover */}
                                    {showColorPicker && (
                                        <div className="absolute top-full left-0 mt-2 p-2 bg-neutral-800 rounded-xl shadow-xl border border-neutral-700 flex gap-1 z-50">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => {
                                                        setSelectedColor(color);
                                                        setShowColorPicker(false);
                                                    }}
                                                    className={`w-6 h-6 rounded-full border ${color} ${selectedColor === color ? 'ring-2 ring-white' : ''} hover:scale-110 transition-transform`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button className="p-2 hover:bg-neutral-800/50 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-neutral-800/50 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors">
                                    <Bell className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-neutral-800/50 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors">
                                    <Undo className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-neutral-800/50 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors">
                                    <Redo className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    handleCreateNote();
                                    setIsExpanded(false);
                                }}
                                className="px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800/50 rounded-md transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
