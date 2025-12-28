"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Upload, AlertCircle, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

interface PortalInfo {
  code: string;
  name: string;
  description?: string;
  settings: {
    allowMedia: boolean;
    maxMessageLength: number;
  };
  expiresAt: string;
  createdAt: string;
}

const PortalSubmit = () => {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [portal, setPortal] = useState<PortalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "text" | "image" | "video" | "audio"
  >("text");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const textShadowStyle: React.CSSProperties = {
    textShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
  };

  useEffect(() => {
    fetchPortalInfo();
  }, [code]);

  const fetchPortalInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/portals/${code.toUpperCase()}`);
      if (response.data.success) {
        setPortal(response.data.portal);
      }
    } catch (err: any) {
      if (err.response?.status === 410) {
        setError("This portal has expired");
      } else if (err.response?.status === 404) {
        setError("Portal not found");
      } else {
        setError("Failed to load portal");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post(
        `/portals/${code.toUpperCase()}/messages`,
        {
          content: message,
          type: messageType,
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        setMessage("");
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to submit message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeRemaining = () => {
    if (!portal) return "";
    const now = new Date();
    const expires = new Date(portal.expiresAt);
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center"
        style={textShadowStyle}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error && !portal) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center p-4"
        style={textShadowStyle}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl text-center max-w-md"
        >
          <AlertCircle size={64} className="text-red-300 mx-auto mb-4" />
          <h2 className="text-white text-3xl font-bold mb-4">{error}</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="bg-white text-blue-600 font-bold text-lg px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Go Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative overflow-hidden flex items-center justify-center p-4"
      style={textShadowStyle}
    >
      {/* Animated decorations */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: [0, 360],
        }}
        transition={{
          duration: 1,
          rotate: {
            repeat: Infinity,
            duration: 10,
            ease: "linear",
          },
        }}
        className="absolute left-10 top-10 text-7xl"
      >
        📬
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: [0, -360],
        }}
        transition={{
          duration: 1,
          rotate: {
            repeat: Infinity,
            duration: 15,
            ease: "linear",
          },
        }}
        className="absolute right-10 top-20 text-6xl"
      >
        💌
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute left-1/4 bottom-20 text-6xl"
      >
        🔒
      </motion.div>

      <div className="max-w-2xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-white font-black text-5xl md:text-6xl mb-4">
            {portal?.name}
          </h1>
          {portal?.description && (
            <p className="text-white/80 text-xl mb-4">{portal.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-white/70">
            <span className="text-sm">
              Code: <span className="font-mono font-bold">{portal?.code}</span>
            </span>
            <span className="text-sm">•</span>
            <span className="text-sm">Expires in {getTimeRemaining()}</span>
          </div>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle size={80} className="text-green-300 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-white text-3xl font-bold mb-4">
              Message Sent!
            </h2>
            <p className="text-white/80 text-lg mb-6">
              Your anonymous message has been delivered
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSubmitted(false)}
              className="bg-white text-blue-600 font-bold text-lg px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Send Another
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl"
          >
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="text-white text-xl font-bold mb-4 block">
                  Send an anonymous message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  maxLength={portal?.settings.maxMessageLength || 5000}
                  rows={6}
                  className="w-full px-6 py-4 rounded-2xl text-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-2 border-white/30 focus:border-white focus:outline-none transition-all resize-none"
                  autoFocus
                />
                <p className="text-white/70 text-sm mt-2">
                  {message.length}/{portal?.settings.maxMessageLength || 5000}{" "}
                  characters
                </p>
              </div>

              {portal?.settings.allowMedia && (
                <div className="mb-6">
                  <label className="text-white text-sm font-semibold mb-3 block">
                    Message Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["text", "image", "video", "audio"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMessageType(type as any)}
                        className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                          messageType === type
                            ? "bg-white text-blue-600"
                            : "bg-white/20 text-white border-2 border-white/30 hover:border-white"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 mb-4"
                >
                  <p className="text-red-300 text-center">{error}</p>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full bg-white text-blue-600 font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                      className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    Send Anonymously
                  </>
                )}
              </motion.button>

              <p className="text-white/60 text-sm text-center mt-4">
                Your identity will remain completely anonymous
              </p>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PortalSubmit;
