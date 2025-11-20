"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { apps } from "@/lib/apps";

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close dropdown when route changes
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [pathname]);

    if (!user) return null;

    const currentApp = apps.find((app) => app.href !== "/" && pathname.startsWith(app.href));
    const isAppPage = pathname !== "/" && pathname !== "/login";

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 h-16">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                            Antigravity
                        </span>
                    </Link>

                    {/* App Dropdown - Only visible on app pages or if user wants to navigate */}
                    {isAppPage && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                            >
                                <span className="text-neutral-400 text-sm">App:</span>
                                <div className="flex items-center gap-2">
                                    {currentApp ? (
                                        <>
                                            <currentApp.icon className={`w-4 h-4 ${currentApp.navbarColor}`} />
                                            <span className="font-medium text-white">{currentApp.name}</span>
                                        </>
                                    ) : (
                                        <span className="font-medium text-white">Select App</span>
                                    )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-neutral-900 border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                    {apps.map((app) => (
                                        <Link
                                            key={app.name}
                                            href={app.href}
                                            className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${pathname === app.href ? "bg-white/5" : ""
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${app.navbarBgColor}`}>
                                                <app.icon className={`w-4 h-4 ${app.navbarColor}`} />
                                            </div>
                                            <span className="text-neutral-200 font-medium">{app.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="flex items-center gap-2">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full border border-white/10"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-white/10">
                                    <UserIcon className="w-4 h-4 text-neutral-400" />
                                </div>
                            )}
                            <span className="hidden sm:block text-sm text-neutral-300 font-medium">
                                {user.displayName || user.email?.split("@")[0]}
                            </span>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-neutral-400 hover:text-red-400 group"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
