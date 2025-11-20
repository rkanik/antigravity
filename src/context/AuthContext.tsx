"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    grantContactsPermission: () => Promise<boolean>;
    grantYouTubePermission: () => Promise<boolean>;
    grantDrivePermission: () => Promise<boolean>;
    grantGmailPermission: () => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Save user to Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastSeen: new Date(),
            }, { merge: true });

            router.push("/");
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const grantContactsPermission = async () => {
        if (!auth.currentUser) return false;

        try {
            const uid = auth.currentUser.uid;
            const scope = "https://www.googleapis.com/auth/contacts.readonly";
            const name = "contacts";
            const next = "/contacts";

            window.location.href = `/api/auth/redirect?scope=${encodeURIComponent(scope)}&name=${encodeURIComponent(name)}&uid=${uid}&next=${encodeURIComponent(next)}`;

            return true;
        } catch (error) {
            console.error("Error initiating contacts permission flow", error);
            return false;
        }
    };

    const grantYouTubePermission = async () => {
        if (!auth.currentUser) return false;

        try {
            const uid = auth.currentUser.uid;
            const scope = "https://www.googleapis.com/auth/youtube.readonly";
            const name = "youtube";
            const next = "/youtube";

            window.location.href = `/api/auth/redirect?scope=${encodeURIComponent(scope)}&name=${encodeURIComponent(name)}&uid=${uid}&next=${encodeURIComponent(next)}`;

            return true;
        } catch (error) {
            console.error("Error initiating youtube permission flow", error);
            return false;
        }
    };

    const grantDrivePermission = async () => {
        if (!auth.currentUser) return false;

        try {
            const uid = auth.currentUser.uid;
            const scope = "https://www.googleapis.com/auth/drive.readonly";
            const name = "drive";
            const next = "/drive";

            window.location.href = `/api/auth/redirect?scope=${encodeURIComponent(scope)}&name=${encodeURIComponent(name)}&uid=${uid}&next=${encodeURIComponent(next)}`;

            return true;
        } catch (error) {
            console.error("Error initiating drive permission flow", error);
            return false;
        }
    };

    const grantGmailPermission = async () => {
        if (!auth.currentUser) return false;

        try {
            const uid = auth.currentUser.uid;
            const scope = "https://www.googleapis.com/auth/gmail.modify";
            const name = "gmail";
            const next = "/gmail";

            window.location.href = `/api/auth/redirect?scope=${encodeURIComponent(scope)}&name=${encodeURIComponent(name)}&uid=${uid}&next=${encodeURIComponent(next)}`;

            return true;
        } catch (error) {
            console.error("Error initiating gmail permission flow", error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, grantContactsPermission, grantYouTubePermission, grantDrivePermission, grantGmailPermission, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
