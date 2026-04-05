"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions";

export function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-400">TTS SaaS</h1>
      </div>

      <nav className="space-y-2">
        <Link
          href="/dashboard"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/tts"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Text to Speech
        </Link>
        <Link
          href="/dashboard/voices"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Voices
        </Link>
        <Link
          href="/dashboard/credits"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Credits
        </Link>
        <Link
          href="/dashboard/settings"
          className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Settings
        </Link>
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-800 transition-colors text-red-400"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
