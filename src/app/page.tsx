"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { apps } from "@/lib/apps";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const appsList = apps.filter(app => app.href !== "/");

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <main className="max-w-6xl mx-auto pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {appsList.map((app) => (
            <Link
              key={app.name}
              href={app.href}
              className="group relative bg-neutral-900/50 border border-white/10 rounded-3xl p-6 hover:bg-neutral-800/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${app.dashboardColor} opacity-10 blur-[50px] group-hover:opacity-20 transition-opacity`} />

              <div className={`w-12 h-12 ${app.dashboardColor} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <app.icon className="w-6 h-6 text-white" />
              </div>

              <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">
                {app.name}
              </h2>
              <p className="text-neutral-400 text-sm">
                {app.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
