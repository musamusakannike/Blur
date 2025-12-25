"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { getStoredUser, isAuthenticated } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"rooms" | "portals">("rooms");
  const [rooms, setRooms] = useState<any[]>([]);
  const [portals, setPortals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }
    setUser(getStoredUser());
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, portalsRes] = await Promise.all([
        api.get("/rooms/my/created"),
        api.get("/portals/my/created"),
      ]);
      setRooms(roomsRes.data.rooms);
      setPortals(portalsRes.data.portals);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-2xl border border-gray-800">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
            <p className="text-gray-400">@{user.username}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800 pb-4">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "rooms"
                ? "bg-white text-black"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800"
            }`}
          >
            My Rooms
          </button>
          <button
            onClick={() => setActiveTab("portals")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "portals"
                ? "bg-white text-black"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800"
            }`}
          >
            My Portals
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {activeTab === "rooms" ? (
              rooms.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
                  No rooms created yet
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 flex justify-between items-center group hover:border-gray-700 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300 font-mono">
                          {room.code}
                        </span>
                        <span className="text-sm text-gray-500">
                          • {room.participantsCount || 0} participants
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Expires {formatDistanceToNow(new Date(room.expiresAt), { addSuffix: true })}</div>
                      <button 
                        onClick={() => copyToClipboard(room.code)}
                        className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              portals.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
                  No portals created yet
                </div>
              ) : (
                portals.map((portal) => (
                  <div
                    key={portal.id}
                    className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 flex justify-between items-center group hover:border-gray-700 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{portal.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300 font-mono">
                          {portal.code}
                        </span>
                        {portal.stats?.unreadMessages > 0 && (
                          <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded font-medium">
                            {portal.stats.unreadMessages} new
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Expires {formatDistanceToNow(new Date(portal.expiresAt), { addSuffix: true })}</div>
                      <button 
                        onClick={() => copyToClipboard(portal.code)}
                        className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
