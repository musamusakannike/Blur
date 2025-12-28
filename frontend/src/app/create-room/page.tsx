"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, LogIn } from "lucide-react";
import { loginWithGoogle, isAuthenticated } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface RoomData {
  name: string;
  description: string;
  lifetime: number;
}

const CreateRoom = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [roomData, setRoomData] = useState<RoomData>({
    name: "",
    description: "",
    lifetime: 3,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomId, setRoomId] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const textShadowStyle: React.CSSProperties = {
    textShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
  };

  const createRoom = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/rooms", {
        name: roomData.name,
        description: roomData.description || undefined,
        lifetime: roomData.lifetime,
      });

      if (response.data.success) {
        setRoomId(response.data.room.id);
        setRoomCode(response.data.room.code);
        setStep(5);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          "Failed to create room. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && !roomData.name.trim()) {
      setError("Please enter a room name");
      return;
    }

    // If we are on step 3 (lifetime) and about to go to step 4 (login),
    // check if we are already authenticated
    if (step === 3) {
      if (isAuthenticated()) {
        await createRoom();
        return;
      }
    }

    setError("");
    setStep(step + 1);
  };

  const handleSkipDescription = () => {
    setError("");
    setStep(3);
  };

  const handleLifetimeChange = (hours: number) => {
    setRoomData({ ...roomData, lifetime: hours });
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      await loginWithGoogle();
      await createRoom();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          "Failed to create room. Please try again."
      );
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative overflow-hidden flex items-center justify-center p-4"
      style={textShadowStyle}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: [0, 15, -10, 15, 0],
        }}
        transition={{
          duration: 0.8,
          rotate: {
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
          },
        }}
        className="absolute left-10 top-10 text-7xl"
      >
        🎉
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
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
        className="absolute right-10 top-20 text-6xl"
      >
        ✨
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute left-1/4 bottom-20 text-6xl"
      >
        🚀
      </motion.div>

      <div className="max-w-2xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-white font-black text-5xl md:text-6xl mb-4">
            Create Your Room
          </h1>
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i <= step ? "bg-white w-12" : "bg-white/30 w-8"
                }`}
                animate={{ width: i <= step ? 48 : 32 }}
              />
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <div className="mb-6">
                <label className="text-white text-2xl font-bold mb-4 block">
                  What's the name of your anonymous room?
                </label>
                <input
                  type="text"
                  value={roomData.name}
                  onChange={(e) =>
                    setRoomData({ ...roomData, name: e.target.value })
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleNext()}
                  placeholder="e.g., Friday Night Vibes"
                  maxLength={100}
                  className="w-full px-6 py-4 rounded-2xl text-xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-2 border-white/30 focus:border-white focus:outline-none transition-all"
                  autoFocus
                />
                <p className="text-white/70 text-sm mt-2">
                  {roomData.name.length}/100 characters
                </p>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-300 mb-4 text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="w-full bg-white text-blue-600 font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                Next <ArrowRight size={24} />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <div className="mb-6">
                <label className="text-white text-2xl font-bold mb-4 block">
                  Add a description (optional)
                </label>
                <textarea
                  value={roomData.description}
                  onChange={(e) =>
                    setRoomData({ ...roomData, description: e.target.value })
                  }
                  placeholder="What's this room about?"
                  maxLength={500}
                  rows={4}
                  className="w-full px-6 py-4 rounded-2xl text-xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-2 border-white/30 focus:border-white focus:outline-none transition-all resize-none"
                  autoFocus
                />
                <p className="text-white/70 text-sm mt-2">
                  {roomData.description.length}/500 characters
                </p>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkipDescription}
                  className="flex-1 bg-white/20 backdrop-blur-sm text-white font-bold text-xl px-8 py-4 rounded-full border-2 border-white/30 hover:border-white transition-all"
                >
                  Skip
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="flex-1 bg-white text-blue-600 font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  Next <ArrowRight size={24} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <div className="mb-8">
                <label className="text-white text-2xl font-bold mb-6 block flex items-center gap-3">
                  <Clock size={32} />
                  How long should this room last?
                </label>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6].map((hours) => (
                    <motion.button
                      key={hours}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLifetimeChange(hours)}
                      className={`aspect-square rounded-2xl font-bold text-2xl transition-all ${
                        roomData.lifetime === hours
                          ? "bg-white text-blue-600 shadow-lg"
                          : "bg-white/20 text-white border-2 border-white/30 hover:border-white"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-3xl md:text-4xl">{hours}</span>
                        <span className="text-xs md:text-sm">
                          hour{hours > 1 ? "s" : ""}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center"
                >
                  <p className="text-white text-lg">
                    Your room will expire in{" "}
                    <span className="font-black text-2xl">
                      {roomData.lifetime}
                    </span>{" "}
                    hour{roomData.lifetime > 1 ? "s" : ""}
                  </p>
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="w-full bg-white text-blue-600 font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                Continue <ArrowRight size={24} />
              </motion.button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-white text-3xl font-bold mb-4">
                  Almost there!
                </h2>
                <p className="text-white/80 text-lg mb-8">
                  Sign in with Google to create your room and get your unique
                  room code
                </p>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-300 mb-4 text-center bg-red-500/20 backdrop-blur-sm rounded-xl p-4"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white text-blue-600 font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
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
                    Creating room...
                  </>
                ) : (
                  <>
                    <LogIn size={24} />
                    Sign in with Google
                  </>
                )}
              </motion.button>

              <p className="text-white/60 text-sm text-center mt-4">
                We'll create your account if you don't have one
              </p>
            </motion.div>
          )}

          {step === 5 && roomCode && roomId && (
            <motion.div
              key="step5"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150 }}
                className="mb-6"
              >
                <div className="text-8xl mb-4">🎊</div>
                <h2 className="text-white text-4xl font-black mb-4">
                  Room Created!
                </h2>
                <p className="text-white/80 text-lg mb-6">
                  Share both the link AND code with others to let them join
                </p>
              </motion.div>

              {/* Room Link */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-4">
                <p className="text-white/80 text-sm mb-2 font-semibold">
                  📎 Unique Room Link
                </p>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="bg-white/30 text-white font-mono text-sm md:text-base py-4 px-4 rounded-xl break-all mb-3"
                >
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/room/${roomId}`
                    : `/room/${roomId}`}
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/room/${roomId}`
                      );
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }
                  }}
                  className="w-full bg-white/20 backdrop-blur-sm text-white font-bold text-lg px-6 py-3 rounded-full border-2 border-white/30 hover:border-white transition-all"
                >
                  {linkCopied ? "✓ Link Copied!" : "Copy Link"}
                </motion.button>
              </div>

              {/* Room Code */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <p className="text-white/80 text-sm mb-2 font-semibold">
                  🔑 Room Code
                </p>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="bg-white text-blue-600 font-black text-4xl md:text-5xl py-4 px-6 rounded-2xl tracking-wider shadow-xl mb-3"
                >
                  {roomCode}
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  }}
                  className="w-full bg-white/20 backdrop-blur-sm text-white font-bold text-lg px-6 py-3 rounded-full border-2 border-white/30 hover:border-white transition-all"
                >
                  {codeCopied ? "✓ Code Copied!" : "Copy Code"}
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/room/${roomId}`)}
                className="w-full bg-white text-blue-600 font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Enter Room
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {step > 1 && step < 5 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setStep(step - 1)}
            className="mt-6 text-white/80 hover:text-white font-semibold text-lg transition-all mx-auto block"
          >
            ← Back
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;
