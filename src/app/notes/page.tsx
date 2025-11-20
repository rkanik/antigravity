"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Note } from "./types";
import CreateNote from "./CreateNote";
import NoteCard from "./NoteCard";
import EditNoteModal from "./EditNoteModal";
import { Loader2, Search, Menu } from "lucide-react";

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { user, loading: authLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "users", user.uid, "notes"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Note[];
            setNotes(notesData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching notes:", err);
            setError("Failed to load notes.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <div className="flex items-center gap-3 mr-8">
                        <button className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400">
                            <Menu className="w-6 h-6" />
                        </button>
                        <img src="https://www.gstatic.com/images/branding/product/1x/keep_2020q4_48dp.png" alt="Keep" className="w-8 h-8" />
                        <span className="text-xl text-neutral-300">Keep</span>
                    </div>

                    <div className="flex-1 max-w-2xl relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border-none rounded-lg leading-5 bg-neutral-800 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:bg-white focus:text-neutral-900 focus:placeholder-neutral-600 sm:text-sm transition-colors shadow-sm"
                        />
                    </div>

                    <div className="flex-1"></div>
                </div>
            </header>

            <main className="p-4 sm:p-8 max-w-7xl mx-auto">
                <CreateNote />

                {loading ? (
                    <div className="flex items-center justify-center h-[200px]">
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 py-12">{error}</div>
                ) : filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-neutral-500 gap-4">
                        <div className="p-4 rounded-full bg-neutral-900">
                            <Search className="w-12 h-12 opacity-20" />
                        </div>
                        <p>{searchQuery ? "No matching notes found" : "Notes you add appear here"}</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 mx-auto pb-20">
                        {filteredNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onClick={() => setSelectedNote(note)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {selectedNote && (
                <EditNoteModal
                    note={selectedNote}
                    onClose={() => setSelectedNote(null)}
                />
            )}
        </div>
    );
}
