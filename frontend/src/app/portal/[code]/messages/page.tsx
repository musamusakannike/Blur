"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, CheckCircle, Circle } from "lucide-react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  type: string;
  mediaUrl?: string;
  mediaSize?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface PortalStats {
  totalMessages: number;
  unreadMessages: number;
}

const PortalMessages = () => {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<PortalStats>({
    totalMessages: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [code, unreadOnly]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/portals/${code.toUpperCase()}/messages`,
        {
          params: { unreadOnly },
        }
      );
      if (response.data.success) {
        setMessages(response.data.messages);
        setStats(response.data.stats);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await api.patch(
        `/portals/${code.toUpperCase()}/messages/${messageId}/read`
      );
      fetchMessages();
    } catch (err) {
      console.error("Failed to mark message as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(`/portals/${code.toUpperCase()}/messages/read-all`);
      fetchMessages();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await api.delete(`/portals/${code.toUpperCase()}/messages/${messageId}`);
      fetchMessages();
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-400">Portal Code</p>
            <p className="text-xl font-mono font-bold">{code}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Messages</p>
            <p className="text-4xl font-bold">{stats.totalMessages}</p>
          </div>
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Unread Messages</p>
            <p className="text-4xl font-bold text-blue-500">
              {stats.unreadMessages}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                unreadOnly
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {unreadOnly ? "Showing Unread Only" : "Show All"}
            </button>
          </div>
          {stats.unreadMessages > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Messages */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
            {unreadOnly ? "No unread messages" : "No messages yet"}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gray-900/50 rounded-2xl p-6 border transition-all ${
                  message.isRead
                    ? "border-gray-800"
                    : "border-blue-500/50 bg-blue-500/5"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {message.isRead ? (
                      <CheckCircle size={20} className="text-gray-600" />
                    ) : (
                      <Circle size={20} className="text-blue-500" />
                    )}
                    <div>
                      <p className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      {message.type !== "text" && (
                        <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400 mt-1 inline-block">
                          {message.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!message.isRead && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="text-white">
                  {message.mediaUrl && (
                    <div className="mb-4">
                      {message.type === "image" && (
                        <img
                          src={message.mediaUrl}
                          alt="Message attachment"
                          className="rounded-xl max-w-md"
                        />
                      )}
                      {message.type === "video" && (
                        <video
                          src={message.mediaUrl}
                          controls
                          className="rounded-xl max-w-md"
                        />
                      )}
                      {message.type === "audio" && (
                        <audio
                          src={message.mediaUrl}
                          controls
                          className="w-full"
                        />
                      )}
                    </div>
                  )}
                  <p className="text-lg whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalMessages;
