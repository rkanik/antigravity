import { Contact, FileText, HardDrive, Play, LayoutGrid, LucideIcon, Bot, Mail, CloudSun, MessageCircle } from "lucide-react";

export interface AppConfig {
    name: string;
    icon: LucideIcon;
    href: string;
    description?: string;
    dashboardColor: string; // For the dashboard grid (e.g., "bg-blue-500")
    navbarColor: string;    // For the navbar icon/text (e.g., "text-blue-400")
    navbarBgColor: string;  // For the navbar icon background (e.g., "bg-blue-500/10")
}

export const apps: AppConfig[] = [
    {
        name: "Dashboard",
        icon: LayoutGrid,
        href: "/",
        description: "Home",
        dashboardColor: "bg-neutral-800",
        navbarColor: "text-white",
        navbarBgColor: "bg-neutral-800",
    },
    {
        name: "Contacts",
        icon: Contact,
        href: "/contacts",
        description: "Manage your connections",
        dashboardColor: "bg-blue-500",
        navbarColor: "text-blue-400",
        navbarBgColor: "bg-blue-500/10",
    },
    {
        name: "Notes",
        icon: FileText,
        href: "/notes",
        description: "Capture your thoughts",
        dashboardColor: "bg-yellow-500",
        navbarColor: "text-yellow-400",
        navbarBgColor: "bg-yellow-500/10",
    },
    {
        name: "Drive",
        icon: HardDrive,
        href: "/drive",
        description: "Store your files",
        dashboardColor: "bg-green-500",
        navbarColor: "text-green-400",
        navbarBgColor: "bg-green-500/10",
    },
    {
        name: "YouTube",
        icon: Play,
        href: "/youtube",
        description: "Watch trending videos",
        dashboardColor: "bg-red-600",
        navbarColor: "text-red-400",
        navbarBgColor: "bg-red-500/10",
    },
    {
        name: "AI Chat",
        icon: Bot,
        href: "/chat",
        description: "Chat with AI Agent",
        dashboardColor: "bg-purple-600",
        navbarColor: "text-purple-400",
        navbarBgColor: "bg-purple-500/10",
    },
    {
        name: "Gmail",
        icon: Mail,
        href: "/gmail",
        description: "Check your emails",
        dashboardColor: "bg-red-500",
        navbarColor: "text-red-400",
        navbarBgColor: "bg-red-500/10",
    },
    {
        name: "Weather",
        icon: CloudSun,
        href: "/weather",
        description: "Check the forecast",
        dashboardColor: "bg-cyan-500",
        navbarColor: "text-cyan-400",
        navbarBgColor: "bg-cyan-500/10",
    },
    {
        name: "Messenger",
        icon: MessageCircle,
        href: "/messenger",
        description: "Connect with friends",
        dashboardColor: "bg-emerald-600",
        navbarColor: "text-emerald-400",
        navbarBgColor: "bg-emerald-500/10",
    },
];
