"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, Chrome } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { signInWithGoogle } = useAuth();
    const router = useRouter();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");
        setTimeout(() => {
            setIsLoggingIn(false);
            setError("Please use Google Sign In for this demo.");
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md p-8 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-10 relative">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-neutral-400">Sign in to access your workspace</p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-neutral-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-neutral-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-lg shadow-blue-500/20"
                    >
                        {isLoggingIn ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow h-px bg-white/10"></div>
                    <span className="px-4 text-sm text-neutral-500">or continue with</span>
                    <div className="flex-grow h-px bg-white/10"></div>
                </div>

                <button
                    onClick={() => signInWithGoogle()}
                    className="w-full bg-white text-neutral-900 font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 hover:bg-neutral-100"
                >
                    <Chrome className="w-5 h-5" />
                    Google
                </button>
            </div>
        </div>
    );
}
